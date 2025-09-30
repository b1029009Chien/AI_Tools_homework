use std::net::SocketAddr;

use axum::{extract::{Path, State}, http::StatusCode, response::IntoResponse, routing::{get, patch}, Json, Router};
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, PgPool, Row};
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{fmt, EnvFilter};

#[derive(Clone)]
struct AppState {
    db: PgPool,
}

#[derive(Serialize, Deserialize, Debug)]
struct CreateTodo {
    title: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct Todo {
    id: uuid::Uuid,
    title: String,
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct NewRequestPayload {
    r#type: String,
    contact_person: String,
    contact_phone: String,
    address: String,
    description: String,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct RequestItem {
    id: uuid::Uuid,
    r#type: String,
    status: String,
    contact_person: String,
    contact_phone: String,
    address: String,
    description: String,
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Serialize, Deserialize, Debug)]
struct UpdateStatusPayload {
    status: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));
    fmt().with_env_filter(filter).init();

    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set, e.g. postgres://user:pass@localhost:5432/dbname");

    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&database_url)
        .await?;

    // Run migrations if available
    if let Err(e) = sqlx::migrate!("./migrations").run(&pool).await {
        tracing::warn!(error = %e, "Skipping migrations (directory may be missing)");
    }

    let state = AppState { db: pool };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(health))
        .route("/todos", get(list_todos).post(create_todo))
        .route("/api/requests", get(list_requests).post(create_request))
        .route("/api/requests/:id/status", patch(update_request_status))
        .with_state(state)
        .layer(cors);

    let addr: SocketAddr = ([0, 0, 0, 0], 3001).into();
    tracing::info!("listening" = %addr);
    axum::serve(tokio::net::TcpListener::bind(addr).await?, app).await?;
    Ok(())
}

async fn health() -> impl IntoResponse {
    (StatusCode::OK, "ok")
}

async fn list_todos(State(state): State<AppState>) -> Result<Json<Vec<Todo>>, (StatusCode, &'static str)> {
    let rows = sqlx::query(
        r#"
        SELECT id, title, created_at
        FROM todos
        ORDER BY created_at DESC
        "#
    )
    .fetch_all(&state.db)
    .await
    .map_err(internal_error)?;

    let todos = rows
        .into_iter()
        .map(|row| Todo {
            id: row.get::<uuid::Uuid, _>("id"),
            title: row.get::<String, _>("title"),
            created_at: row.get::<chrono::DateTime<chrono::Utc>, _>("created_at"),
        })
        .collect();

    Ok(Json(todos))
}

async fn create_todo(
    State(state): State<AppState>,
    Json(payload): Json<CreateTodo>,
) -> Result<(StatusCode, Json<Todo>), (StatusCode, &'static str)> {
    let id = uuid::Uuid::new_v4();
    let row = sqlx::query(
        r#"
        INSERT INTO todos (id, title)
        VALUES ($1, $2)
        RETURNING id, title, created_at
        "#
    )
    .bind(id)
    .bind(&payload.title)
    .fetch_one(&state.db)
    .await
    .map_err(internal_error)?;

    let todo = Todo {
        id: row.get::<uuid::Uuid, _>("id"),
        title: row.get::<String, _>("title"),
        created_at: row.get::<chrono::DateTime<chrono::Utc>, _>("created_at"),
    };
    Ok((StatusCode::CREATED, Json(todo)))
}

fn internal_error<E: std::fmt::Display>(err: E) -> (StatusCode, &'static str) {
    tracing::error!(error = %err, "internal error");
    (StatusCode::INTERNAL_SERVER_ERROR, "internal server error")
}

async fn list_requests(State(state): State<AppState>) -> Result<Json<Vec<RequestItem>>, (StatusCode, &'static str)> {
    let rows = sqlx::query(
        r#"
        SELECT id, type, status, contact_person, contact_phone, address, description, created_at
        FROM requests
        ORDER BY created_at DESC
        "#
    )
    .fetch_all(&state.db)
    .await
    .map_err(internal_error)?;

    let items = rows.into_iter().map(|row| RequestItem {
        id: row.get("id"),
        r#type: row.get("type"),
        status: row.get("status"),
        contact_person: row.get("contact_person"),
        contact_phone: row.get("contact_phone"),
        address: row.get("address"),
        description: row.get("description"),
        created_at: row.get("created_at"),
    }).collect();

    Ok(Json(items))
}

async fn create_request(State(state): State<AppState>, Json(payload): Json<NewRequestPayload>) -> Result<(StatusCode, Json<RequestItem>), (StatusCode, &'static str)> {
    let id = uuid::Uuid::new_v4();
    let row = sqlx::query(
        r#"
        INSERT INTO requests (id, type, contact_person, contact_phone, address, description)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, type, status, contact_person, contact_phone, address, description, created_at
        "#
    )
    .bind(id)
    .bind(&payload.r#type)
    .bind(&payload.contact_person)
    .bind(&payload.contact_phone)
    .bind(&payload.address)
    .bind(&payload.description)
    .fetch_one(&state.db)
    .await
    .map_err(internal_error)?;

    let item = RequestItem {
        id: row.get("id"),
        r#type: row.get("type"),
        status: row.get("status"),
        contact_person: row.get("contact_person"),
        contact_phone: row.get("contact_phone"),
        address: row.get("address"),
        description: row.get("description"),
        created_at: row.get("created_at"),
    };
    Ok((StatusCode::CREATED, Json(item)))
}

async fn update_request_status(
    State(state): State<AppState>,
    Path(id): Path<uuid::Uuid>,
    Json(payload): Json<UpdateStatusPayload>,
) -> Result<Json<RequestItem>, (StatusCode, &'static str)> {
    let row = sqlx::query(
        r#"
        UPDATE requests
        SET status = $2
        WHERE id = $1
        RETURNING id, type, status, contact_person, contact_phone, address, description, created_at
        "#
    )
    .bind(id)
    .bind(&payload.status)
    .fetch_one(&state.db)
    .await
    .map_err(internal_error)?;

    let item = RequestItem {
        id: row.get("id"),
        r#type: row.get("type"),
        status: row.get("status"),
        contact_person: row.get("contact_person"),
        contact_phone: row.get("contact_phone"),
        address: row.get("address"),
        description: row.get("description"),
        created_at: row.get("created_at"),
    };
    Ok(Json(item))
}



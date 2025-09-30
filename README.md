## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `cmd /c npm run`

3. run Database (DB) open DockerEngine
   `docker compose -f rust-backend/docker-compose.yml up -d`

4. Run backend: (different terminal)
   `cd rust-backend`
   if first time: `cargo build`
   and set env
   `$env:DATABASE_URL="postgres://postgres:postgres@localhost:5432/rust_app"`
   `cargo run`

5. stop Ctrl+V two terminal
   In test file
   `docker compose -f rust-backend/docker-compose.yml down`
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `cmd /c npm run`

3. run Database (DB)
   `docker compose -f rust-backend/docker-compose.yml up -d`
   
3. Run backend:
   `cd rust-backend`
   if first time: `cargo build`
   and set env
   `$env:DATABASE_URL="postgres://postgres:postgres@localhost:5432/rust_app"`
   `cargo run`

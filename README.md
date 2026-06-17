# Team Kommunikation

Frontend (React/Vite) + Backend (Rust/Axum) für Gruppen-Chat, Wiki und Wissensgraph.

## Quickstart

```bash
# Backend
cp .env.example .env
cargo run

# Frontend
cd frontend && npm install && npm run dev
```

## Struktur

- `frontend/` -- React SPA (Vite + Tailwind CSS)
- `src/` -- Rust/Axum API (PostgreSQL)
- `migrations/` -- DB Schema + Seed-Daten
- `docs/` -- Architektur- und API-Dokumentation

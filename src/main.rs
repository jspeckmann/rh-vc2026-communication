use std::{env, net::SocketAddr};

use team1_kommunikation::{build_app_with_state, db, state::AppState};

#[tokio::main]
async fn main() {
    let addr = bind_addr();
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("failed to bind Team 1 Kommunikation API");

    println!("Team 1 Kommunikation API listening on http://{addr}");

    let state = match env::var("DATABASE_URL") {
        Ok(database_url) if !database_url.trim().is_empty() => {
            let pool = db::connect(&database_url)
                .await
                .expect("failed to connect Team 1 Kommunikation database");
            db::migrate(&pool)
                .await
                .expect("failed to migrate Team 1 Kommunikation database");
            AppState::with_db_pool(pool)
        }
        _ => AppState::mock(),
    };

    axum::serve(listener, build_app_with_state(state))
        .await
        .expect("Team 1 Kommunikation API server failed");
}

fn bind_addr() -> SocketAddr {
    let host = env::var("APP_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = env::var("PORT")
        .ok()
        .and_then(|value| value.parse::<u16>().ok())
        .unwrap_or(8001);

    format!("{host}:{port}")
        .parse()
        .expect("APP_HOST and PORT must form a valid socket address")
}

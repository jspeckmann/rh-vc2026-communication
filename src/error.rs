use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::models::{ErrorBody, ErrorResponse};

#[derive(Debug)]
pub enum AppError {
    BadRequest {
        message: String,
        field: Option<String>,
    },
    NotFound {
        message: String,
    },
    ServiceUnavailable {
        code: &'static str,
        message: String,
    },
    Database {
        message: String,
    },
    StatePoisoned,
}

impl AppError {
    pub fn bad_request(message: impl Into<String>, field: impl Into<Option<&'static str>>) -> Self {
        Self::BadRequest {
            message: message.into(),
            field: field.into().map(str::to_string),
        }
    }

    pub fn bad_request_field(message: impl Into<String>, field: impl Into<String>) -> Self {
        Self::BadRequest {
            message: message.into(),
            field: Some(field.into()),
        }
    }

    pub fn not_found(message: impl Into<String>) -> Self {
        Self::NotFound {
            message: message.into(),
        }
    }

    pub fn matrix_unavailable(message: impl Into<String>) -> Self {
        Self::ServiceUnavailable {
            code: "matrix_unavailable",
            message: message.into(),
        }
    }

    pub fn database(error: sqlx::Error) -> Self {
        match error {
            sqlx::Error::RowNotFound => Self::not_found("Datensatz wurde nicht gefunden"),
            sqlx::Error::Database(database_error) => match database_error.code().as_deref() {
                Some("23503") => Self::bad_request("Referenzierter Datensatz fehlt", None),
                Some("23505") => {
                    Self::bad_request("Datensatz verletzt eine Eindeutigkeitsregel", None)
                }
                Some("23514") => {
                    Self::bad_request("Datensatz verletzt eine Validierungsregel", None)
                }
                _ => Self::Database {
                    message: format!("Datenbankfehler: {database_error}"),
                },
            },
            other => Self::Database {
                message: format!("Datenbankfehler: {other}"),
            },
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, code, message, field) = match self {
            Self::BadRequest { message, field } => {
                (StatusCode::BAD_REQUEST, "bad_request", message, field)
            }
            Self::NotFound { message } => (StatusCode::NOT_FOUND, "not_found", message, None),
            Self::ServiceUnavailable { code, message } => {
                (StatusCode::SERVICE_UNAVAILABLE, code, message, None)
            }
            Self::Database { message } => (
                StatusCode::SERVICE_UNAVAILABLE,
                "database_unavailable",
                message,
                None,
            ),
            Self::StatePoisoned => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "state_poisoned",
                "Interner Modul-State ist nicht verfuegbar".to_string(),
                None,
            ),
        };

        (
            status,
            Json(ErrorResponse {
                error: ErrorBody {
                    code: code.to_string(),
                    message,
                    field,
                },
            }),
        )
            .into_response()
    }
}

use axum::{
    Json,
    extract::{FromRequest, Request},
};
use serde::de::DeserializeOwned;
use serde_json::Value;

use crate::error::AppError;

pub trait RequiredJsonFields {
    const REQUIRED_FIELDS: &'static [&'static str];
}

pub struct RequiredJson<T>(pub T);

impl<S, T> FromRequest<S> for RequiredJson<T>
where
    Json<Value>: FromRequest<S>,
    S: Send + Sync,
    T: DeserializeOwned + RequiredJsonFields,
{
    type Rejection = AppError;

    async fn from_request(request: Request, state: &S) -> Result<Self, Self::Rejection> {
        let Json(value) = Json::<Value>::from_request(request, state)
            .await
            .map_err(|_| AppError::bad_request("JSON-Body ist ungueltig", None))?;

        let object = value
            .as_object()
            .ok_or_else(|| AppError::bad_request("JSON-Body muss ein Objekt sein", None))?;

        for field in T::REQUIRED_FIELDS {
            if !object.contains_key(*field) {
                return Err(AppError::bad_request_field(
                    format!("{field} ist erforderlich"),
                    *field,
                ));
            }
        }

        serde_json::from_value(value)
            .map(Self)
            .map_err(|_| AppError::bad_request("JSON-Body ist ungueltig", None))
    }
}

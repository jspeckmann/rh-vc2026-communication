pub mod db;
pub mod error;
pub mod models;
pub mod request_json;
pub mod routes;
pub mod seed;
pub mod state;

use axum::{Json, Router, routing::get};
use models::{ChatIndexResponse, HealthResponse};
use routes::{agent, dashboard, feed, groups, knowledge, matrix, threads, users, wiki};
use state::AppState;
use utoipa::OpenApi;

pub fn build_app() -> Router {
    build_app_with_state(AppState::default())
}

pub fn build_app_with_state(state: AppState) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/openapi.json", get(openapi_json))
        .nest("/api/chat", chat_router())
        .nest("/chat", chat_router())
        .fallback(routes::not_found)
        .with_state(state)
}

fn chat_router() -> Router<AppState> {
    Router::new()
        .route("/", get(chat_index))
        .merge(users::router())
        .merge(groups::router())
        .merge(threads::router())
        .merge(wiki::router())
        .merge(feed::router())
        .merge(knowledge::router())
        .merge(agent::router())
        .merge(matrix::router())
        .merge(dashboard::router())
}

#[utoipa::path(
    get,
    path = "/health",
    responses((status = 200, description = "Modul ist erreichbar", body = HealthResponse)),
    tag = "health"
)]
async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
    })
}

#[utoipa::path(
    get,
    path = "/api/chat",
    responses((status = 200, description = "Kommunikationsmodul Einstieg", body = ChatIndexResponse)),
    tag = "chat"
)]
async fn chat_index() -> Json<ChatIndexResponse> {
    Json(ChatIndexResponse {
        module: "Kommunikation".to_string(),
        frontend_route: "/chat".to_string(),
        api_base_path: "/api/chat".to_string(),
        local_dev_alias: "/chat".to_string(),
        docs: "/openapi.json".to_string(),
    })
}

async fn openapi_json() -> Json<utoipa::openapi::OpenApi> {
    Json(ApiDoc::openapi())
}

#[derive(OpenApi)]
#[openapi(
    paths(
        health,
        chat_index,
        users::list_users,
        users::get_user,
        groups::list_groups,
        groups::create_group,
        groups::get_group,
        groups::add_group_member,
        threads::list_threads,
        threads::create_thread,
        threads::list_messages,
        threads::create_message,
        wiki::list_wiki,
        wiki::create_wiki_article,
        wiki::get_wiki_article,
        wiki::update_wiki_article,
        feed::list_feed,
        feed::rebuild_feed,
        knowledge::list_nodes,
        knowledge::create_node,
        knowledge::list_edges,
        knowledge::create_edge,
        knowledge::knowledge_graph,
        agent::analyze,
        agent::list_agent_feed,
        agent::get_agent_feed_item,
        agent::create_agent_feedback,
        matrix::link_matrix_user,
        matrix::get_matrix_user,
        matrix::link_matrix_room,
        matrix::list_matrix_rooms,
        dashboard::dashboard
    ),
    components(schemas(
        models::HealthResponse,
        models::ChatIndexResponse,
        models::ErrorBody,
        models::ErrorResponse,
        models::UserRef,
        models::UserListResponse,
        models::Group,
        models::GroupListResponse,
        models::CreateGroupRequest,
        models::GroupDetails,
        models::GroupMemberDetail,
        models::MatrixRoomSummary,
        models::AddGroupMemberRequest,
        models::GroupMember,
        models::ThreadItem,
        models::ThreadListResponse,
        models::CreateThreadRequest,
        models::Message,
        models::MessageListResponse,
        models::CreateMessageRequest,
        models::WikiArticle,
        models::WikiArticleSummary,
        models::WikiListResponse,
        models::CreateWikiArticleRequest,
        models::UpdateWikiArticleRequest,
        models::UpdateWikiArticleResponse,
        models::FeedItem,
        models::FeedListResponse,
        models::FeedRebuildRequest,
        models::FeedRebuildResponse,
        models::KnowledgeNode,
        models::KnowledgeEdge,
        models::KnowledgeNodeListResponse,
        models::CreateKnowledgeNodeRequest,
        models::KnowledgeEdgeListResponse,
        models::CreateKnowledgeEdgeRequest,
        models::KnowledgeGraphResponse,
        models::AgentAnalyzeRequest,
        models::AgentAnalyzeResponse,
        models::AgentFeedItem,
        models::AgentFeedSummary,
        models::AgentFeedItemDetails,
        models::AgentFeedListResponse,
        models::AgentFeedback,
        models::AgentFeedbackCounts,
        models::CreateAgentFeedbackRequest,
        models::MatrixUserLink,
        models::MatrixRoomLink,
        models::MatrixUserLinkRequest,
        models::MatrixRoomLinkRequest,
        models::MatrixRoomListResponse,
        models::DashboardResponse,
        models::DashboardStatus,
        models::DashboardKnowledgeGraph
    )),
    tags(
        (name = "health", description = "Healthcheck fuer Gateway und Monitoring"),
        (name = "chat", description = "Team-1-Kommunikationsmodul"),
        (name = "users", description = "Dummy-Useradapter bis Team 5 den echten Endpunkt liefert"),
        (name = "groups", description = "Gruppen und Mitglieder"),
        (name = "threads", description = "Diskussionen, Fragen, Entscheidungen und Nachrichten"),
        (name = "wiki", description = "Knowledge-Base-Artikel"),
        (name = "feed", description = "Gruppenfeed"),
        (name = "knowledge", description = "Knowledge Graph"),
        (name = "agent", description = "Mockbarer Agent-Feed mit Feedback"),
        (name = "matrix", description = "Matrix-User- und Raum-Links"),
        (name = "dashboard", description = "Submit-Dashboard fuer Demo und Integration")
    )
)]
struct ApiDoc;

#[cfg(test)]
mod tests {
    use axum::{
        body::Body,
        http::{Method, Request, StatusCode},
    };
    use http_body_util::BodyExt;
    use serde_json::{Value, json};
    use tower::ServiceExt;

    use super::build_app;

    async fn request_json(method: Method, uri: &str, body: Option<Value>) -> (StatusCode, Value) {
        let request_body = body
            .map(|value| Body::from(value.to_string()))
            .unwrap_or_else(Body::empty);
        let response = build_app()
            .oneshot(
                Request::builder()
                    .method(method)
                    .uri(uri)
                    .header("content-type", "application/json")
                    .body(request_body)
                    .unwrap(),
            )
            .await
            .unwrap();
        let status = response.status();
        let bytes = response.into_body().collect().await.unwrap().to_bytes();
        let body = serde_json::from_slice(&bytes).unwrap();

        (status, body)
    }

    async fn get_json(uri: &str) -> (StatusCode, Value) {
        request_json(Method::GET, uri, None).await
    }

    #[tokio::test]
    async fn health_returns_ok() {
        let (status, body) = get_json("/health").await;

        assert_eq!(status, StatusCode::OK);
        assert_eq!(body, json!({ "status": "ok" }));
    }

    #[tokio::test]
    async fn users_endpoint_returns_dummy_users() {
        let (status, body) = get_json("/api/chat/users").await;

        assert_eq!(status, StatusCode::OK);
        assert_eq!(body["users"].as_array().unwrap().len(), 3);
        assert_eq!(body["users"][0]["source"], "dummy");
    }

    #[tokio::test]
    async fn user_endpoint_returns_one_dummy_user() {
        let (status, body) = get_json("/api/chat/users/user-david").await;

        assert_eq!(status, StatusCode::OK);
        assert_eq!(body["id"], "user-david");
        assert_eq!(body["displayName"], "David");
    }

    #[tokio::test]
    async fn unknown_user_uses_json_error_format() {
        let (status, body) = get_json("/api/chat/users/unknown").await;

        assert_eq!(status, StatusCode::NOT_FOUND);
        assert_eq!(
            body,
            json!({
                "error": {
                    "code": "not_found",
                    "message": "User wurde nicht gefunden"
                }
            })
        );
    }

    #[tokio::test]
    async fn openapi_json_lists_core_paths() {
        let (status, body) = get_json("/openapi.json").await;

        assert_eq!(status, StatusCode::OK);
        assert!(body["paths"]["/health"].is_object());
        assert!(body["paths"]["/api/chat/users"].is_object());
        assert!(body["paths"]["/api/chat/groups"].is_object());
        assert!(body["paths"]["/api/chat/wiki/{id}"].is_object());
        assert!(body["paths"]["/api/chat/feed/rebuild"].is_object());
        assert!(body["paths"]["/api/chat/knowledge/nodes"].is_object());
        assert!(body["paths"]["/api/chat/knowledge/edges"].is_object());
        assert!(body["paths"]["/api/chat/knowledge/graph"].is_object());
        assert!(body["paths"]["/api/chat/threads"]["post"]["responses"]["400"].is_object());
        assert!(body["paths"]["/api/chat/wiki/{id}"]["put"]["responses"]["404"].is_object());
        assert!(
            body["paths"]["/api/chat/matrix/users/{userId}"]["get"]["responses"]["404"].is_object()
        );
    }

    #[tokio::test]
    async fn chat_local_dev_alias_still_works() {
        let (status, body) = get_json("/chat/users").await;

        assert_eq!(status, StatusCode::OK);
        assert_eq!(body["users"][0]["id"], "user-david");
    }

    #[tokio::test]
    async fn submit_minimum_endpoints_have_demo_data() {
        let (status, groups) = get_json("/api/chat/groups").await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(groups["groups"].as_array().unwrap().len(), 2);

        let (status, wiki) = get_json("/api/chat/wiki").await;
        assert_eq!(status, StatusCode::OK);
        assert!(wiki["articles"].as_array().unwrap().len() >= 2);

        let (status, feed) = get_json("/api/chat/feed").await;
        assert_eq!(status, StatusCode::OK);
        assert!(feed["items"].as_array().unwrap().len() >= 3);
        assert_eq!(feed["items"][0]["id"], "feed-3");

        let (status, graph) = get_json("/api/chat/knowledge/graph").await;
        assert_eq!(status, StatusCode::OK);
        assert!(graph["nodes"].as_array().unwrap().len() >= 5);
        assert!(graph["edges"].as_array().unwrap().len() >= 5);

        let (status, agent) = get_json("/api/chat/agent/feed").await;
        assert_eq!(status, StatusCode::OK);
        assert!(agent["items"].as_array().unwrap().len() >= 3);

        let (status, dashboard) = get_json("/api/chat/dashboard").await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(dashboard["status"]["api"], "ok");
        assert!(dashboard["knowledgeGraph"]["nodeCount"].as_u64().unwrap() >= 5);
    }

    #[tokio::test]
    async fn post_group_and_agent_feedback_use_shared_error_and_state() {
        let (status, created_group) = request_json(
            Method::POST,
            "/api/chat/groups",
            Some(json!({
                "name": "Demo Review",
                "description": "Reviewbare lokale Gruppe",
                "createdByUserId": "user-david"
            })),
        )
        .await;
        assert_eq!(status, StatusCode::CREATED);
        assert_eq!(created_group["memberIds"], json!(["user-david"]));

        let (status, feedback) = request_json(
            Method::POST,
            "/api/chat/agent/feed/agent-1/feedback",
            Some(json!({
                "userId": "user-samira",
                "value": 1,
                "reason": "Hilft im Demo-Readback."
            })),
        )
        .await;
        assert_eq!(status, StatusCode::CREATED);
        assert_eq!(feedback["agentFeedItemId"], "agent-1");

        let (status, missing) = get_json("/api/chat/groups/does-not-exist").await;
        assert_eq!(status, StatusCode::NOT_FOUND);
        assert_eq!(missing["error"]["code"], "not_found");
    }

    #[tokio::test]
    async fn contract_gap_routes_are_implemented() {
        let (status, updated_wiki) = request_json(
            Method::PUT,
            "/api/chat/wiki/wiki-matrix-postgres",
            Some(json!({
                "title": "Matrix, PostgreSQL und Agent-Feed",
                "body": "Matrix ist Chat-Layer. PostgreSQL bleibt Modul-Wahrheit.",
                "tags": ["matrix", "postgresql", "agent"]
            })),
        )
        .await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(updated_wiki["id"], "wiki-matrix-postgres");
        assert_eq!(
            updated_wiki["tags"],
            json!(["matrix", "postgresql", "agent"])
        );

        let (status, rebuild) = request_json(
            Method::POST,
            "/api/chat/feed/rebuild",
            Some(json!({ "groupId": "group-team-1" })),
        )
        .await;
        assert_eq!(status, StatusCode::ACCEPTED);
        assert_eq!(
            rebuild,
            json!({ "status": "accepted_mock", "groupId": "group-team-1" })
        );

        let (status, nodes) = get_json("/api/chat/knowledge/nodes").await;
        assert_eq!(status, StatusCode::OK);
        assert!(nodes["nodes"].as_array().unwrap().len() >= 5);

        let (status, created_node) = request_json(
            Method::POST,
            "/api/chat/knowledge/nodes",
            Some(json!({
                "type": "topic",
                "title": "Matrix-Verknuepfung",
                "summary": "Wie Gruppen und Matrix-Raeume verbunden werden",
                "sourceType": "thread",
                "sourceId": "thread-matrix-link"
            })),
        )
        .await;
        assert_eq!(status, StatusCode::CREATED);
        assert_eq!(created_node["type"], "topic");

        let (status, edges) = get_json("/api/chat/knowledge/edges").await;
        assert_eq!(status, StatusCode::OK);
        assert!(edges["edges"].as_array().unwrap().len() >= 5);

        let (status, created_edge) = request_json(
            Method::POST,
            "/api/chat/knowledge/edges",
            Some(json!({
                "fromNodeId": "node-thread-architecture",
                "toNodeId": "node-wiki-matrix-postgres",
                "relation": "references",
                "confidence": 0.9,
                "sourceType": "wiki_article",
                "sourceId": "wiki-matrix-postgres"
            })),
        )
        .await;
        assert_eq!(status, StatusCode::CREATED);
        assert_eq!(created_edge["relation"], "references");
    }

    #[tokio::test]
    async fn validation_rejects_invalid_matrix_and_graph_payloads() {
        let (status, matrix_error) = request_json(
            Method::POST,
            "/api/chat/matrix/users/link",
            Some(json!({
                "userId": "user-david",
                "matrixUserId": "david"
            })),
        )
        .await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert_eq!(matrix_error["error"]["code"], "bad_request");
        assert_eq!(matrix_error["error"]["field"], "matrixUserId");

        let (status, edge_error) = request_json(
            Method::POST,
            "/api/chat/knowledge/edges",
            Some(json!({
                "fromNodeId": "node-thread-architecture",
                "toNodeId": "node-thread-architecture",
                "relation": "references",
                "confidence": 0.9,
                "sourceType": "wiki_article",
                "sourceId": "wiki-matrix-postgres"
            })),
        )
        .await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert_eq!(edge_error["error"]["code"], "bad_request");
        assert_eq!(edge_error["error"]["field"], "toNodeId");

        let (status, missing_node) = request_json(
            Method::POST,
            "/api/chat/knowledge/edges",
            Some(json!({
                "fromNodeId": "node-does-not-exist",
                "toNodeId": "node-thread-architecture",
                "relation": "references",
                "confidence": 0.9,
                "sourceType": "wiki_article",
                "sourceId": "wiki-matrix-postgres"
            })),
        )
        .await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert_eq!(missing_node["error"]["field"], "fromNodeId");
    }

    #[tokio::test]
    async fn validation_rejects_missing_required_json_fields() {
        let (status, group_error) = request_json(
            Method::POST,
            "/api/chat/groups",
            Some(json!({
                "description": "Ohne Namen",
                "createdByUserId": "user-david"
            })),
        )
        .await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert_eq!(group_error["error"]["code"], "bad_request");
        assert_eq!(group_error["error"]["field"], "name");

        let (status, edge_error) = request_json(
            Method::POST,
            "/api/chat/knowledge/edges",
            Some(json!({
                "fromNodeId": "node-thread-architecture",
                "toNodeId": "node-wiki-matrix-postgres",
                "relation": "references",
                "sourceType": "wiki_article",
                "sourceId": "wiki-matrix-postgres"
            })),
        )
        .await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert_eq!(edge_error["error"]["code"], "bad_request");
        assert_eq!(edge_error["error"]["field"], "confidence");

        let (status, room_error) = request_json(
            Method::POST,
            "/api/chat/matrix/rooms/link",
            Some(json!({
                "groupId": "group-team-1",
                "matrixRoomId": "!team1:example.test"
            })),
        )
        .await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert_eq!(room_error["error"]["code"], "bad_request");
        assert_eq!(room_error["error"]["field"], "isPrimary");
    }

    #[tokio::test]
    async fn validation_rejects_unknown_agent_sources_and_missing_links() {
        let (status, source_error) = request_json(
            Method::POST,
            "/api/chat/agent/analyze",
            Some(json!({
                "groupId": "group-team-1",
                "sourceType": "thread",
                "sourceId": "thread-does-not-exist",
                "mode": "mock"
            })),
        )
        .await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert_eq!(source_error["error"]["code"], "bad_request");
        assert_eq!(source_error["error"]["field"], "sourceId");

        let (status, missing_matrix_link) = get_json("/api/chat/matrix/users/unknown").await;
        assert_eq!(status, StatusCode::NOT_FOUND);
        assert_eq!(missing_matrix_link["error"]["code"], "not_found");
        assert_eq!(
            missing_matrix_link["error"]["message"],
            "Matrix-User-Link wurde nicht gefunden"
        );

        let (status, duplicate_matrix_user) = request_json(
            Method::POST,
            "/api/chat/matrix/users/link",
            Some(json!({
                "userId": "user-samira",
                "matrixUserId": "@david:matrix.local"
            })),
        )
        .await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert_eq!(duplicate_matrix_user["error"]["code"], "bad_request");
        assert_eq!(duplicate_matrix_user["error"]["field"], "matrixUserId");
    }
}

use axum::{
    Json, Router,
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post},
};
use serde::Deserialize;
use serde_json::json;

use crate::{
    db, error::AppError, models::*, request_json::RequiredJson, seed::NOW, state::AppState,
};

pub async fn not_found() -> Response {
    AppError::not_found("Route wurde nicht gefunden").into_response()
}

fn filter_group<T, F>(items: Vec<T>, group_id: Option<&str>, group_id_of: F) -> Vec<T>
where
    F: Fn(&T) -> &str,
{
    match group_id {
        Some(group_id) => items
            .into_iter()
            .filter(|item| group_id_of(item) == group_id)
            .collect(),
        None => items,
    }
}

#[derive(Deserialize)]
pub struct GroupFilter {
    #[serde(rename = "groupId")]
    group_id: Option<String>,
}

const THREAD_TYPES: [&str; 3] = ["discussion", "question", "decision"];
const MEMBER_ROLES: [&str; 2] = ["owner", "member"];
const KNOWLEDGE_NODE_TYPES: [&str; 7] = [
    "person",
    "group",
    "topic",
    "decision",
    "wiki_article",
    "thread",
    "agent_item",
];
const KNOWLEDGE_EDGE_RELATIONS: [&str; 7] = [
    "member_of",
    "discussed_in",
    "decided_by",
    "references",
    "owns",
    "related_to",
    "created_by_agent",
];
const AGENT_SOURCE_TYPES: [&str; 4] = ["thread", "wiki_article", "feed_item", "agent_feed_item"];
const AGENT_MODES: [&str; 3] = ["mock", "summary", "next_steps"];

fn validate_required(value: &str, field: &'static str) -> Result<(), AppError> {
    if value.trim().is_empty() {
        Err(AppError::bad_request(
            format!("{field} ist erforderlich"),
            field,
        ))
    } else {
        Ok(())
    }
}

fn validate_thread_type(thread_type: &str) -> Result<(), AppError> {
    if THREAD_TYPES.contains(&thread_type) {
        Ok(())
    } else {
        Err(AppError::bad_request(
            "type muss discussion, question oder decision sein",
            "type",
        ))
    }
}

fn validate_member_role(member_role: &str) -> Result<(), AppError> {
    if MEMBER_ROLES.contains(&member_role) {
        Ok(())
    } else {
        Err(AppError::bad_request(
            "memberRole muss owner oder member sein",
            "memberRole",
        ))
    }
}

fn validate_knowledge_node_type(node_type: &str) -> Result<(), AppError> {
    if KNOWLEDGE_NODE_TYPES.contains(&node_type) {
        Ok(())
    } else {
        Err(AppError::bad_request(
            "type muss person, group, topic, decision, wiki_article, thread oder agent_item sein",
            "type",
        ))
    }
}

fn validate_knowledge_edge_relation(relation: &str) -> Result<(), AppError> {
    if KNOWLEDGE_EDGE_RELATIONS.contains(&relation) {
        Ok(())
    } else {
        Err(AppError::bad_request(
            "relation muss member_of, discussed_in, decided_by, references, owns, related_to oder created_by_agent sein",
            "relation",
        ))
    }
}

fn validate_confidence(confidence: f32) -> Result<(), AppError> {
    if (0.0..=1.0).contains(&confidence) {
        Ok(())
    } else {
        Err(AppError::bad_request(
            "confidence muss zwischen 0.0 und 1.0 liegen",
            "confidence",
        ))
    }
}

fn validate_matrix_id(value: &str, field: &'static str, sigil: char) -> Result<(), AppError> {
    validate_required(value, field)?;
    let mut parts = value.splitn(2, ':');
    let localpart = parts.next().unwrap_or_default();
    let server = parts.next().unwrap_or_default();
    if localpart.starts_with(sigil) && localpart.len() > 1 && !server.trim().is_empty() {
        Ok(())
    } else {
        Err(AppError::bad_request(
            format!("{field} hat ein ungueltiges Matrix-Format"),
            field,
        ))
    }
}

fn validate_optional_matrix_alias(alias: Option<&str>) -> Result<(), AppError> {
    if let Some(alias) = alias {
        validate_matrix_id(alias, "roomAlias", '#')?;
    }
    Ok(())
}

fn validate_agent_source_type(source_type: &str) -> Result<(), AppError> {
    if AGENT_SOURCE_TYPES.contains(&source_type) {
        Ok(())
    } else {
        Err(AppError::bad_request(
            "sourceType muss thread, wiki_article, feed_item oder agent_feed_item sein",
            "sourceType",
        ))
    }
}

fn validate_agent_mode(mode: Option<&str>) -> Result<(), AppError> {
    match mode {
        Some(mode) if AGENT_MODES.contains(&mode) => Ok(()),
        None => Ok(()),
        Some(_) => Err(AppError::bad_request(
            "mode muss mock, summary oder next_steps sein",
            "mode",
        )),
    }
}

fn validate_wiki_status(status: Option<&str>) -> Result<(), AppError> {
    match status {
        Some("published" | "draft" | "archived") | None => Ok(()),
        Some(_) => Err(AppError::bad_request(
            "status muss published, draft oder archived sein",
            "status",
        )),
    }
}

fn map_row_not_found(error: sqlx::Error, message: &'static str) -> AppError {
    match error {
        sqlx::Error::RowNotFound => AppError::not_found(message),
        other => AppError::database(other),
    }
}

async fn group_exists(state: &AppState, group_id: &str) -> Result<bool, AppError> {
    if let Some(pool) = state.db_pool() {
        return db::group_exists_bool(pool, group_id)
            .await
            .map_err(AppError::database);
    }
    let store = state.read_store()?;
    Ok(store.groups.iter().any(|group| group.id == group_id))
}

async fn user_exists(state: &AppState, user_id: &str) -> Result<bool, AppError> {
    if let Some(pool) = state.db_pool() {
        return db::user_exists(pool, user_id)
            .await
            .map_err(AppError::database);
    }
    let store = state.read_store()?;
    Ok(store.users.iter().any(|user| user.id == user_id))
}

async fn thread_exists(state: &AppState, thread_id: &str) -> Result<bool, AppError> {
    if let Some(pool) = state.db_pool() {
        return db::thread_exists(pool, thread_id)
            .await
            .map_err(AppError::database);
    }
    let store = state.read_store()?;
    Ok(store.threads.iter().any(|thread| thread.id == thread_id))
}

async fn wiki_article_exists(state: &AppState, article_id: &str) -> Result<bool, AppError> {
    if let Some(pool) = state.db_pool() {
        return db::wiki_article_exists(pool, article_id)
            .await
            .map_err(AppError::database);
    }
    let store = state.read_store()?;
    Ok(store
        .wiki_articles
        .iter()
        .any(|article| article.id == article_id))
}

async fn knowledge_node_exists(state: &AppState, node_id: &str) -> Result<bool, AppError> {
    if let Some(pool) = state.db_pool() {
        return db::knowledge_node_exists(pool, node_id)
            .await
            .map_err(AppError::database);
    }
    let store = state.read_store()?;
    Ok(store.knowledge_nodes.iter().any(|node| node.id == node_id))
}

async fn agent_source_exists(
    state: &AppState,
    group_id: &str,
    source_type: &str,
    source_id: &str,
) -> Result<bool, AppError> {
    if let Some(pool) = state.db_pool() {
        return match source_type {
            "thread" => db::thread_in_group_exists(pool, source_id, group_id).await,
            "wiki_article" => db::wiki_article_in_group_exists(pool, source_id, group_id).await,
            "feed_item" => db::feed_item_in_group_exists(pool, source_id, group_id).await,
            "agent_feed_item" => {
                db::agent_feed_item_in_group_exists(pool, source_id, group_id).await
            }
            _ => Ok(false),
        }
        .map_err(AppError::database);
    }
    let store = state.read_store()?;
    Ok(match source_type {
        "thread" => store
            .threads
            .iter()
            .any(|thread| thread.id == source_id && thread.group_id == group_id),
        "wiki_article" => store
            .wiki_articles
            .iter()
            .any(|article| article.id == source_id && article.group_id == group_id),
        "feed_item" => store
            .feed_items
            .iter()
            .any(|item| item.id == source_id && item.group_id == group_id),
        "agent_feed_item" => store
            .agent_feed_items
            .iter()
            .any(|item| item.id == source_id && item.group_id == group_id),
        _ => false,
    })
}

async fn agent_feed_item_exists(state: &AppState, item_id: &str) -> Result<bool, AppError> {
    if let Some(pool) = state.db_pool() {
        return db::agent_feed_item_exists(pool, item_id)
            .await
            .map_err(AppError::database);
    }
    let store = state.read_store()?;
    Ok(store.agent_feed_items.iter().any(|item| item.id == item_id))
}

async fn ensure_group_id(state: &AppState, group_id: &str) -> Result<(), AppError> {
    if group_exists(state, group_id).await? {
        Ok(())
    } else {
        Err(AppError::bad_request("groupId ist unbekannt", "groupId"))
    }
}

async fn ensure_optional_group_filter(
    state: &AppState,
    group_id: Option<&str>,
) -> Result<(), AppError> {
    if let Some(group_id) = group_id {
        ensure_group_id(state, group_id).await?;
    }
    Ok(())
}

async fn ensure_user_id(
    state: &AppState,
    user_id: &str,
    field: &'static str,
    message: &'static str,
) -> Result<(), AppError> {
    if user_exists(state, user_id).await? {
        Ok(())
    } else {
        Err(AppError::bad_request(message, field))
    }
}

async fn ensure_thread_path(state: &AppState, thread_id: &str) -> Result<(), AppError> {
    if thread_exists(state, thread_id).await? {
        Ok(())
    } else {
        Err(AppError::not_found("Thread wurde nicht gefunden"))
    }
}

async fn ensure_wiki_article_path(state: &AppState, article_id: &str) -> Result<(), AppError> {
    if wiki_article_exists(state, article_id).await? {
        Ok(())
    } else {
        Err(AppError::not_found("Wiki-Artikel wurde nicht gefunden"))
    }
}

async fn ensure_knowledge_node_id(
    state: &AppState,
    node_id: &str,
    field: &'static str,
) -> Result<(), AppError> {
    if knowledge_node_exists(state, node_id).await? {
        Ok(())
    } else {
        Err(AppError::bad_request(
            "Knowledge-Graph-Knoten ist unbekannt",
            field,
        ))
    }
}

async fn ensure_agent_source(
    state: &AppState,
    group_id: &str,
    source_type: &str,
    source_id: &str,
) -> Result<(), AppError> {
    if agent_source_exists(state, group_id, source_type, source_id).await? {
        Ok(())
    } else {
        Err(AppError::bad_request(
            "sourceId ist fuer sourceType und groupId unbekannt",
            "sourceId",
        ))
    }
}

async fn ensure_agent_feed_item_path(state: &AppState, item_id: &str) -> Result<(), AppError> {
    if agent_feed_item_exists(state, item_id).await? {
        Ok(())
    } else {
        Err(AppError::not_found("Agent-Feed-Item wurde nicht gefunden"))
    }
}

fn sort_wiki_summaries_desc(articles: &mut [WikiArticleSummary]) {
    articles.sort_by(|left, right| {
        right
            .updated_at
            .cmp(&left.updated_at)
            .then_with(|| left.id.cmp(&right.id))
    });
}

fn sort_feed_desc(items: &mut [FeedItem]) {
    items.sort_by(|left, right| {
        right
            .created_at
            .cmp(&left.created_at)
            .then_with(|| left.id.cmp(&right.id))
    });
}

fn matrix_status(has_room_links: bool) -> String {
    if has_room_links {
        "link_configured".to_string()
    } else {
        "not_configured".to_string()
    }
}

pub mod users {
    use super::*;

    pub fn router() -> Router<AppState> {
        Router::new()
            .route("/users", get(list_users))
            .route("/users/{id}", get(get_user))
    }

    #[utoipa::path(
        get,
        path = "/api/chat/users",
        responses((status = 200, description = "Dummy-Userliste", body = UserListResponse)),
        tag = "users"
    )]
    pub async fn list_users(
        State(state): State<AppState>,
    ) -> Result<Json<UserListResponse>, AppError> {
        if let Some(pool) = state.db_pool() {
            return Ok(Json(UserListResponse {
                users: db::list_users(pool).await.map_err(AppError::database)?,
            }));
        }
        let store = state.read_store()?;
        Ok(Json(UserListResponse {
            users: store.users.clone(),
        }))
    }

    #[utoipa::path(
        get,
        path = "/api/chat/users/{id}",
        params(("id" = String, Path, description = "Dummy-User-ID")),
        responses(
            (status = 200, description = "Dummy-User", body = UserRef),
            (status = 404, description = "User wurde nicht gefunden", body = ErrorResponse)
        ),
        tag = "users"
    )]
    pub async fn get_user(
        Path(user_id): Path<String>,
        State(state): State<AppState>,
    ) -> Result<Json<UserRef>, AppError> {
        if let Some(pool) = state.db_pool() {
            return db::get_user(pool, &user_id)
                .await
                .map(Json)
                .map_err(|error| map_row_not_found(error, "User wurde nicht gefunden"));
        }
        let store = state.read_store()?;
        store
            .users
            .iter()
            .find(|user| user.id == user_id)
            .cloned()
            .map(Json)
            .ok_or_else(|| AppError::not_found("User wurde nicht gefunden"))
    }
}

pub mod groups {
    use super::*;

    pub fn router() -> Router<AppState> {
        Router::new()
            .route("/groups", get(list_groups).post(create_group))
            .route("/groups/{id}", get(get_group))
            .route("/groups/{id}/members", post(add_group_member))
    }

    #[utoipa::path(
        get,
        path = "/api/chat/groups",
        responses((status = 200, description = "Gruppenliste", body = GroupListResponse)),
        tag = "groups"
    )]
    pub async fn list_groups(
        State(state): State<AppState>,
    ) -> Result<Json<GroupListResponse>, AppError> {
        if let Some(pool) = state.db_pool() {
            return Ok(Json(GroupListResponse {
                groups: db::list_groups(pool).await.map_err(AppError::database)?,
            }));
        }
        let store = state.read_store()?;
        Ok(Json(GroupListResponse {
            groups: store.groups_with_primary_matrix_rooms(),
        }))
    }

    #[utoipa::path(
        post,
        path = "/api/chat/groups",
        request_body = CreateGroupRequest,
        responses(
            (status = 201, description = "Gruppe erstellt", body = Group),
            (status = 400, description = "Ungueltige Anfrage", body = ErrorResponse)
        ),
        tag = "groups"
    )]
    pub async fn create_group(
        State(state): State<AppState>,
        RequiredJson(request): RequiredJson<CreateGroupRequest>,
    ) -> Result<(StatusCode, Json<Group>), AppError> {
        if request.name.trim().is_empty() {
            return Err(AppError::bad_request("name ist erforderlich", "name"));
        }
        ensure_user_id(
            &state,
            &request.created_by_user_id,
            "createdByUserId",
            "createdByUserId ist unbekannt",
        )
        .await?;
        if let Some(pool) = state.db_pool() {
            let group = db::create_group(pool, request)
                .await
                .map_err(AppError::database)?;
            return Ok((StatusCode::CREATED, Json(group)));
        }

        let mut store = state.write_store()?;
        let group = Group {
            id: store.next_id("group"),
            name: request.name,
            description: request.description,
            member_ids: vec![request.created_by_user_id.clone()],
            matrix_room_id: None,
            created_at: NOW.to_string(),
        };
        store.group_members.push(GroupMember {
            group_id: group.id.clone(),
            user_id: request.created_by_user_id,
            member_role: "owner".to_string(),
            joined_at: NOW.to_string(),
        });
        store.groups.push(group.clone());

        Ok((StatusCode::CREATED, Json(group)))
    }

    #[utoipa::path(
        get,
        path = "/api/chat/groups/{id}",
        params(("id" = String, Path, description = "Gruppen-ID")),
        responses(
            (status = 200, description = "Gruppendetails", body = GroupDetails),
            (status = 404, description = "Gruppe wurde nicht gefunden", body = ErrorResponse)
        ),
        tag = "groups"
    )]
    pub async fn get_group(
        Path(group_id): Path<String>,
        State(state): State<AppState>,
    ) -> Result<Json<GroupDetails>, AppError> {
        if !group_exists(&state, &group_id).await? {
            return Err(AppError::not_found("Gruppe wurde nicht gefunden"));
        }
        if let Some(pool) = state.db_pool() {
            return db::get_group_details(pool, &group_id)
                .await
                .map(Json)
                .map_err(AppError::database);
        }
        let store = state.read_store()?;
        let group = store
            .groups
            .iter()
            .find(|group| group.id == group_id)
            .ok_or_else(|| AppError::not_found("Gruppe wurde nicht gefunden"))?;

        let members = store
            .group_members
            .iter()
            .filter(|member| member.group_id == group.id)
            .filter_map(|member| {
                store
                    .users
                    .iter()
                    .find(|user| user.id == member.user_id)
                    .map(|user| GroupMemberDetail {
                        user_id: member.user_id.clone(),
                        display_name: user.display_name.clone(),
                        member_role: member.member_role.clone(),
                    })
            })
            .collect();

        let matrix_room = store
            .matrix_room_links
            .iter()
            .find(|room| room.group_id == group.id && room.is_primary)
            .map(|room| MatrixRoomSummary {
                matrix_room_id: room.matrix_room_id.clone(),
                room_alias: room.room_alias.clone(),
                link_status: room.link_status.clone(),
            });

        Ok(Json(GroupDetails {
            id: group.id.clone(),
            name: group.name.clone(),
            description: group.description.clone(),
            members,
            matrix_room,
        }))
    }

    #[utoipa::path(
        post,
        path = "/api/chat/groups/{id}/members",
        params(("id" = String, Path, description = "Gruppen-ID")),
        request_body = AddGroupMemberRequest,
        responses(
            (status = 201, description = "Mitglied hinzugefuegt", body = GroupMember),
            (status = 400, description = "Ungueltige Anfrage", body = ErrorResponse),
            (status = 404, description = "Gruppe oder User wurde nicht gefunden", body = ErrorResponse)
        ),
        tag = "groups"
    )]
    pub async fn add_group_member(
        Path(group_id): Path<String>,
        State(state): State<AppState>,
        RequiredJson(request): RequiredJson<AddGroupMemberRequest>,
    ) -> Result<(StatusCode, Json<GroupMember>), AppError> {
        if !group_exists(&state, &group_id).await? {
            return Err(AppError::not_found("Gruppe wurde nicht gefunden"));
        }
        validate_required(&request.user_id, "userId")?;
        validate_required(&request.member_role, "memberRole")?;
        validate_member_role(&request.member_role)?;
        ensure_user_id(&state, &request.user_id, "userId", "userId ist unbekannt").await?;
        if let Some(pool) = state.db_pool() {
            let member = db::add_group_member(pool, &group_id, request)
                .await
                .map_err(AppError::database)?;
            return Ok((StatusCode::CREATED, Json(member)));
        }
        let mut store = state.write_store()?;
        if let Some(group) = store.groups.iter_mut().find(|group| group.id == group_id) {
            if !group.member_ids.iter().any(|id| id == &request.user_id) {
                group.member_ids.push(request.user_id.clone());
            }
        }
        if let Some(member) = store
            .group_members
            .iter_mut()
            .find(|member| member.group_id == group_id && member.user_id == request.user_id)
        {
            member.member_role = request.member_role;
            return Ok((StatusCode::CREATED, Json(member.clone())));
        }
        let member = GroupMember {
            group_id,
            user_id: request.user_id,
            member_role: request.member_role,
            joined_at: NOW.to_string(),
        };
        store.group_members.push(member.clone());
        Ok((StatusCode::CREATED, Json(member)))
    }
}

pub mod threads {
    use super::*;

    pub fn router() -> Router<AppState> {
        Router::new()
            .route("/threads", get(list_threads).post(create_thread))
            .route(
                "/threads/{id}/messages",
                get(list_messages).post(create_message),
            )
    }

    #[utoipa::path(
        get,
        path = "/api/chat/threads",
        params(("groupId" = Option<String>, Query, description = "Optionale Gruppen-ID")),
        responses((status = 200, description = "Threadliste", body = ThreadListResponse)),
        tag = "threads"
    )]
    pub async fn list_threads(
        Query(filter): Query<GroupFilter>,
        State(state): State<AppState>,
    ) -> Result<Json<ThreadListResponse>, AppError> {
        ensure_optional_group_filter(&state, filter.group_id.as_deref()).await?;
        if let Some(pool) = state.db_pool() {
            return Ok(Json(ThreadListResponse {
                threads: db::list_threads(pool, filter.group_id.as_deref())
                    .await
                    .map_err(AppError::database)?,
            }));
        }
        let store = state.read_store()?;
        Ok(Json(ThreadListResponse {
            threads: filter_group(
                store.threads.clone(),
                filter.group_id.as_deref(),
                |thread| &thread.group_id,
            ),
        }))
    }

    #[utoipa::path(
        post,
        path = "/api/chat/threads",
        request_body = CreateThreadRequest,
        responses(
            (status = 201, description = "Thread erstellt", body = ThreadItem),
            (status = 400, description = "Ungueltige Anfrage", body = ErrorResponse),
            (status = 404, description = "Gruppe oder User wurde nicht gefunden", body = ErrorResponse)
        ),
        tag = "threads"
    )]
    pub async fn create_thread(
        State(state): State<AppState>,
        RequiredJson(request): RequiredJson<CreateThreadRequest>,
    ) -> Result<(StatusCode, Json<ThreadItem>), AppError> {
        validate_required(&request.title, "title")?;
        validate_thread_type(&request.thread_type)?;
        ensure_group_id(&state, &request.group_id).await?;
        ensure_user_id(
            &state,
            &request.created_by,
            "createdBy",
            "createdBy ist unbekannt",
        )
        .await?;
        if let Some(pool) = state.db_pool() {
            let thread = db::create_thread(pool, request)
                .await
                .map_err(AppError::database)?;
            return Ok((StatusCode::CREATED, Json(thread)));
        }
        let mut store = state.write_store()?;
        let thread = ThreadItem {
            id: store.next_id("thread"),
            group_id: request.group_id,
            title: request.title,
            thread_type: request.thread_type,
            status: "open".to_string(),
            created_by: request.created_by,
            created_at: NOW.to_string(),
        };
        store.threads.push(thread.clone());
        Ok((StatusCode::CREATED, Json(thread)))
    }

    #[utoipa::path(
        get,
        path = "/api/chat/threads/{id}/messages",
        params(("id" = String, Path, description = "Thread-ID")),
        responses(
            (status = 200, description = "Nachrichten", body = MessageListResponse),
            (status = 404, description = "Thread wurde nicht gefunden", body = ErrorResponse)
        ),
        tag = "threads"
    )]
    pub async fn list_messages(
        Path(thread_id): Path<String>,
        State(state): State<AppState>,
    ) -> Result<Json<MessageListResponse>, AppError> {
        ensure_thread_path(&state, &thread_id).await?;
        if let Some(pool) = state.db_pool() {
            return Ok(Json(MessageListResponse {
                messages: db::list_messages(pool, &thread_id)
                    .await
                    .map_err(AppError::database)?,
            }));
        }
        let store = state.read_store()?;
        Ok(Json(MessageListResponse {
            messages: store
                .messages
                .iter()
                .filter(|message| message.thread_id == thread_id)
                .cloned()
                .collect(),
        }))
    }

    #[utoipa::path(
        post,
        path = "/api/chat/threads/{id}/messages",
        params(("id" = String, Path, description = "Thread-ID")),
        request_body = CreateMessageRequest,
        responses(
            (status = 201, description = "Nachricht erstellt", body = Message),
            (status = 400, description = "Ungueltige Anfrage", body = ErrorResponse),
            (status = 404, description = "Thread wurde nicht gefunden", body = ErrorResponse)
        ),
        tag = "threads"
    )]
    pub async fn create_message(
        Path(thread_id): Path<String>,
        State(state): State<AppState>,
        RequiredJson(request): RequiredJson<CreateMessageRequest>,
    ) -> Result<(StatusCode, Json<Message>), AppError> {
        ensure_thread_path(&state, &thread_id).await?;
        validate_required(&request.body, "body")?;
        ensure_user_id(
            &state,
            &request.author_id,
            "authorId",
            "authorId ist unbekannt",
        )
        .await?;
        if let Some(pool) = state.db_pool() {
            let message = db::create_message(pool, &thread_id, request)
                .await
                .map_err(AppError::database)?;
            return Ok((StatusCode::CREATED, Json(message)));
        }
        let mut store = state.write_store()?;
        let thread = store
            .threads
            .iter()
            .find(|thread| thread.id == thread_id)
            .ok_or_else(|| AppError::not_found("Thread wurde nicht gefunden"))?;
        let primary_room = store
            .matrix_room_links
            .iter()
            .find(|room| room.group_id == thread.group_id && room.is_primary)
            .map(|room| (room.id.clone(), room.matrix_room_id.clone()));
        let matrix_room_id = primary_room
            .as_ref()
            .map(|(_, matrix_room_id)| matrix_room_id.clone());
        let matrix_event_id = primary_room.as_ref().map(|_| store.next_id("event"));
        let message = Message {
            id: store.next_id("msg"),
            thread_id,
            matrix_room_id,
            matrix_event_id: matrix_event_id.clone(),
            author_id: request.author_id,
            body: request.body,
            priority_label: "normal".to_string(),
            priority_score: 0.5,
            created_at: NOW.to_string(),
        };
        if let (Some((matrix_room_link_id, _)), Some(matrix_event_id)) =
            (primary_room, matrix_event_id)
        {
            let event_link = MatrixEventLink {
                id: store.next_id("mel"),
                matrix_room_link_id,
                matrix_event_id,
                source_type: "message_cache".to_string(),
                source_id: message.id.clone(),
                created_at: NOW.to_string(),
            };
            store.matrix_event_links.push(event_link);
        }
        store.messages.push(message.clone());
        Ok((StatusCode::CREATED, Json(message)))
    }
}

pub mod wiki {
    use super::*;

    pub fn router() -> Router<AppState> {
        Router::new()
            .route("/wiki", get(list_wiki).post(create_wiki_article))
            .route("/wiki/{id}", get(get_wiki_article).put(update_wiki_article))
    }

    #[utoipa::path(
        get,
        path = "/api/chat/wiki",
        params(("groupId" = Option<String>, Query, description = "Optionale Gruppen-ID")),
        responses((status = 200, description = "Wiki-Artikel", body = WikiListResponse)),
        tag = "wiki"
    )]
    pub async fn list_wiki(
        Query(filter): Query<GroupFilter>,
        State(state): State<AppState>,
    ) -> Result<Json<WikiListResponse>, AppError> {
        ensure_optional_group_filter(&state, filter.group_id.as_deref()).await?;
        if let Some(pool) = state.db_pool() {
            return Ok(Json(WikiListResponse {
                articles: db::list_wiki(pool, filter.group_id.as_deref())
                    .await
                    .map_err(AppError::database)?,
            }));
        }
        let store = state.read_store()?;
        let mut articles: Vec<_> = filter_group(
            store.wiki_articles.clone(),
            filter.group_id.as_deref(),
            |article| &article.group_id,
        )
        .into_iter()
        .map(WikiArticleSummary::from)
        .collect();
        sort_wiki_summaries_desc(&mut articles);
        Ok(Json(WikiListResponse { articles }))
    }

    #[utoipa::path(
        post,
        path = "/api/chat/wiki",
        request_body = CreateWikiArticleRequest,
        responses(
            (status = 201, description = "Wiki-Artikel erstellt", body = WikiArticle),
            (status = 400, description = "Ungueltige Anfrage", body = ErrorResponse),
            (status = 404, description = "Gruppe oder User wurde nicht gefunden", body = ErrorResponse)
        ),
        tag = "wiki"
    )]
    pub async fn create_wiki_article(
        State(state): State<AppState>,
        RequiredJson(request): RequiredJson<CreateWikiArticleRequest>,
    ) -> Result<(StatusCode, Json<WikiArticle>), AppError> {
        validate_required(&request.title, "title")?;
        validate_required(&request.body, "body")?;
        validate_wiki_status(request.status.as_deref())?;
        ensure_group_id(&state, &request.group_id).await?;
        ensure_user_id(
            &state,
            &request.author_id,
            "authorId",
            "authorId ist unbekannt",
        )
        .await?;
        if let Some(pool) = state.db_pool() {
            let article = db::create_wiki_article(pool, request)
                .await
                .map_err(AppError::database)?;
            return Ok((StatusCode::CREATED, Json(article)));
        }
        let mut store = state.write_store()?;
        let article = WikiArticle {
            id: store.next_id("wiki"),
            group_id: request.group_id,
            title: request.title,
            body: request.body,
            tags: request.tags,
            author_id: request.author_id,
            status: request.status.unwrap_or_else(|| "published".to_string()),
            created_at: NOW.to_string(),
            updated_at: NOW.to_string(),
        };
        store.wiki_articles.push(article.clone());
        Ok((StatusCode::CREATED, Json(article)))
    }

    #[utoipa::path(
        get,
        path = "/api/chat/wiki/{id}",
        params(("id" = String, Path, description = "Wiki-ID")),
        responses(
            (status = 200, description = "Wiki-Artikel", body = WikiArticle),
            (status = 404, description = "Wiki-Artikel wurde nicht gefunden", body = ErrorResponse)
        ),
        tag = "wiki"
    )]
    pub async fn get_wiki_article(
        Path(article_id): Path<String>,
        State(state): State<AppState>,
    ) -> Result<Json<WikiArticle>, AppError> {
        ensure_wiki_article_path(&state, &article_id).await?;
        if let Some(pool) = state.db_pool() {
            return db::get_wiki_article(pool, &article_id)
                .await
                .map(Json)
                .map_err(AppError::database);
        }
        let store = state.read_store()?;
        store
            .wiki_articles
            .iter()
            .find(|article| article.id == article_id)
            .cloned()
            .map(Json)
            .ok_or_else(|| AppError::not_found("Wiki-Artikel wurde nicht gefunden"))
    }

    #[utoipa::path(
        put,
        path = "/api/chat/wiki/{id}",
        params(("id" = String, Path, description = "Wiki-ID")),
        request_body = UpdateWikiArticleRequest,
        responses(
            (status = 200, description = "Wiki-Artikel aktualisiert", body = UpdateWikiArticleResponse),
            (status = 400, description = "Ungueltige Anfrage", body = ErrorResponse),
            (status = 404, description = "Wiki-Artikel wurde nicht gefunden", body = ErrorResponse)
        ),
        tag = "wiki"
    )]
    pub async fn update_wiki_article(
        Path(article_id): Path<String>,
        State(state): State<AppState>,
        RequiredJson(request): RequiredJson<UpdateWikiArticleRequest>,
    ) -> Result<Json<UpdateWikiArticleResponse>, AppError> {
        ensure_wiki_article_path(&state, &article_id).await?;
        validate_required(&request.title, "title")?;
        validate_required(&request.body, "body")?;
        validate_wiki_status(request.status.as_deref())?;
        if let Some(pool) = state.db_pool() {
            return db::update_wiki_article(pool, &article_id, request)
                .await
                .map(Json)
                .map_err(AppError::database);
        }
        let mut store = state.write_store()?;
        let article = store
            .wiki_articles
            .iter_mut()
            .find(|article| article.id == article_id)
            .ok_or_else(|| AppError::not_found("Wiki-Artikel wurde nicht gefunden"))?;
        article.title = request.title;
        article.body = request.body;
        article.tags = request.tags;
        if let Some(status) = request.status {
            article.status = status;
        }
        article.updated_at = NOW.to_string();
        Ok(Json(UpdateWikiArticleResponse {
            id: article.id.clone(),
            title: article.title.clone(),
            tags: article.tags.clone(),
            status: article.status.clone(),
            updated_at: article.updated_at.clone(),
        }))
    }
}

pub mod feed {
    use super::*;

    pub fn router() -> Router<AppState> {
        Router::new()
            .route("/feed", get(list_feed))
            .route("/feed/rebuild", post(rebuild_feed))
    }

    #[utoipa::path(
        get,
        path = "/api/chat/feed",
        params(("groupId" = Option<String>, Query, description = "Optionale Gruppen-ID")),
        responses((status = 200, description = "Feed", body = FeedListResponse)),
        tag = "feed"
    )]
    pub async fn list_feed(
        Query(filter): Query<GroupFilter>,
        State(state): State<AppState>,
    ) -> Result<Json<FeedListResponse>, AppError> {
        ensure_optional_group_filter(&state, filter.group_id.as_deref()).await?;
        if let Some(pool) = state.db_pool() {
            return Ok(Json(FeedListResponse {
                items: db::list_feed(pool, filter.group_id.as_deref())
                    .await
                    .map_err(AppError::database)?,
            }));
        }
        let store = state.read_store()?;
        let mut items = filter_group(
            store.feed_items.clone(),
            filter.group_id.as_deref(),
            |item| &item.group_id,
        );
        sort_feed_desc(&mut items);
        Ok(Json(FeedListResponse { items }))
    }

    #[utoipa::path(
        post,
        path = "/api/chat/feed/rebuild",
        request_body = FeedRebuildRequest,
        responses(
            (status = 202, description = "Feed-Rebuild angenommen", body = FeedRebuildResponse),
            (status = 400, description = "Ungueltige Anfrage", body = ErrorResponse),
            (status = 404, description = "Gruppe wurde nicht gefunden", body = ErrorResponse)
        ),
        tag = "feed"
    )]
    pub async fn rebuild_feed(
        State(state): State<AppState>,
        RequiredJson(request): RequiredJson<FeedRebuildRequest>,
    ) -> Result<(StatusCode, Json<FeedRebuildResponse>), AppError> {
        ensure_group_id(&state, &request.group_id).await?;
        Ok((
            StatusCode::ACCEPTED,
            Json(FeedRebuildResponse {
                status: "accepted_mock".to_string(),
                group_id: request.group_id,
            }),
        ))
    }
}

pub mod knowledge {
    use super::*;

    pub fn router() -> Router<AppState> {
        Router::new()
            .route("/knowledge/graph", get(knowledge_graph))
            .route("/knowledge/nodes", get(list_nodes).post(create_node))
            .route("/knowledge/edges", get(list_edges).post(create_edge))
    }

    #[utoipa::path(
        get,
        path = "/api/chat/knowledge/nodes",
        responses((status = 200, description = "Knowledge-Graph-Knoten", body = KnowledgeNodeListResponse)),
        tag = "knowledge"
    )]
    pub async fn list_nodes(
        State(state): State<AppState>,
    ) -> Result<Json<KnowledgeNodeListResponse>, AppError> {
        if let Some(pool) = state.db_pool() {
            return Ok(Json(KnowledgeNodeListResponse {
                nodes: db::list_knowledge_nodes(pool)
                    .await
                    .map_err(AppError::database)?,
            }));
        }
        let store = state.read_store()?;
        Ok(Json(KnowledgeNodeListResponse {
            nodes: store.knowledge_nodes.clone(),
        }))
    }

    #[utoipa::path(
        post,
        path = "/api/chat/knowledge/nodes",
        request_body = CreateKnowledgeNodeRequest,
        responses(
            (status = 201, description = "Knowledge-Graph-Knoten erstellt", body = KnowledgeNode),
            (status = 400, description = "Ungueltige Anfrage", body = ErrorResponse)
        ),
        tag = "knowledge"
    )]
    pub async fn create_node(
        State(state): State<AppState>,
        RequiredJson(request): RequiredJson<CreateKnowledgeNodeRequest>,
    ) -> Result<(StatusCode, Json<KnowledgeNode>), AppError> {
        validate_required(&request.node_type, "type")?;
        validate_required(&request.title, "title")?;
        validate_required(&request.summary, "summary")?;
        validate_required(&request.source_type, "sourceType")?;
        validate_required(&request.source_id, "sourceId")?;
        validate_knowledge_node_type(&request.node_type)?;
        if let Some(pool) = state.db_pool() {
            let node = db::create_knowledge_node(pool, request)
                .await
                .map_err(AppError::database)?;
            return Ok((StatusCode::CREATED, Json(node)));
        }
        let mut store = state.write_store()?;
        let node = KnowledgeNode {
            id: store.next_id("node"),
            node_type: request.node_type,
            title: request.title,
            summary: request.summary,
            source_type: request.source_type,
            source_id: request.source_id,
        };
        store.knowledge_nodes.push(node.clone());
        Ok((StatusCode::CREATED, Json(node)))
    }

    #[utoipa::path(
        get,
        path = "/api/chat/knowledge/edges",
        responses((status = 200, description = "Knowledge-Graph-Kanten", body = KnowledgeEdgeListResponse)),
        tag = "knowledge"
    )]
    pub async fn list_edges(
        State(state): State<AppState>,
    ) -> Result<Json<KnowledgeEdgeListResponse>, AppError> {
        if let Some(pool) = state.db_pool() {
            return Ok(Json(KnowledgeEdgeListResponse {
                edges: db::list_knowledge_edges(pool)
                    .await
                    .map_err(AppError::database)?,
            }));
        }
        let store = state.read_store()?;
        Ok(Json(KnowledgeEdgeListResponse {
            edges: store.knowledge_edges.clone(),
        }))
    }

    #[utoipa::path(
        post,
        path = "/api/chat/knowledge/edges",
        request_body = CreateKnowledgeEdgeRequest,
        responses(
            (status = 201, description = "Knowledge-Graph-Kante erstellt", body = KnowledgeEdge),
            (status = 400, description = "Ungueltige Anfrage", body = ErrorResponse)
        ),
        tag = "knowledge"
    )]
    pub async fn create_edge(
        State(state): State<AppState>,
        RequiredJson(request): RequiredJson<CreateKnowledgeEdgeRequest>,
    ) -> Result<(StatusCode, Json<KnowledgeEdge>), AppError> {
        validate_required(&request.from_node_id, "fromNodeId")?;
        validate_required(&request.to_node_id, "toNodeId")?;
        validate_required(&request.relation, "relation")?;
        validate_required(&request.source_type, "sourceType")?;
        validate_required(&request.source_id, "sourceId")?;
        validate_knowledge_edge_relation(&request.relation)?;
        validate_confidence(request.confidence)?;
        if request.from_node_id == request.to_node_id {
            return Err(AppError::bad_request(
                "Self-Edges sind nicht erlaubt",
                "toNodeId",
            ));
        }
        ensure_knowledge_node_id(&state, &request.from_node_id, "fromNodeId").await?;
        ensure_knowledge_node_id(&state, &request.to_node_id, "toNodeId").await?;
        if let Some(pool) = state.db_pool() {
            let edge = db::create_knowledge_edge(pool, request)
                .await
                .map_err(AppError::database)?;
            return Ok((StatusCode::CREATED, Json(edge)));
        }
        let mut store = state.write_store()?;
        let edge = KnowledgeEdge {
            id: store.next_id("edge"),
            from_node_id: request.from_node_id,
            to_node_id: request.to_node_id,
            relation: request.relation,
            confidence: request.confidence,
            source_type: request.source_type,
            source_id: request.source_id,
        };
        store.knowledge_edges.push(edge.clone());
        Ok((StatusCode::CREATED, Json(edge)))
    }

    #[utoipa::path(
        get,
        path = "/api/chat/knowledge/graph",
        responses((status = 200, description = "Knowledge Graph", body = KnowledgeGraphResponse)),
        tag = "knowledge"
    )]
    pub async fn knowledge_graph(
        State(state): State<AppState>,
    ) -> Result<Json<KnowledgeGraphResponse>, AppError> {
        if let Some(pool) = state.db_pool() {
            return Ok(Json(KnowledgeGraphResponse {
                nodes: db::list_knowledge_nodes(pool)
                    .await
                    .map_err(AppError::database)?,
                edges: db::list_knowledge_edges(pool)
                    .await
                    .map_err(AppError::database)?,
            }));
        }
        let store = state.read_store()?;
        Ok(Json(KnowledgeGraphResponse {
            nodes: store.knowledge_nodes.clone(),
            edges: store.knowledge_edges.clone(),
        }))
    }
}

pub mod agent {
    use super::*;

    pub fn router() -> Router<AppState> {
        Router::new()
            .route("/agent/analyze", post(analyze))
            .route("/agent/feed", get(list_agent_feed))
            .route("/agent/feed/{id}", get(get_agent_feed_item))
            .route("/agent/feed/{id}/feedback", post(create_agent_feedback))
    }

    #[utoipa::path(
        post,
        path = "/api/chat/agent/analyze",
        request_body = AgentAnalyzeRequest,
        responses(
            (status = 201, description = "Mock-Agent-Items erzeugt", body = AgentAnalyzeResponse),
            (status = 400, description = "Ungueltige Anfrage", body = ErrorResponse)
        ),
        tag = "agent"
    )]
    pub async fn analyze(
        State(state): State<AppState>,
        RequiredJson(request): RequiredJson<AgentAnalyzeRequest>,
    ) -> Result<(StatusCode, Json<AgentAnalyzeResponse>), AppError> {
        validate_required(&request.group_id, "groupId")?;
        validate_required(&request.source_type, "sourceType")?;
        validate_required(&request.source_id, "sourceId")?;
        validate_agent_source_type(&request.source_type)?;
        validate_agent_mode(request.mode.as_deref())?;
        ensure_group_id(&state, &request.group_id).await?;
        ensure_agent_source(
            &state,
            &request.group_id,
            &request.source_type,
            &request.source_id,
        )
        .await?;
        let content = json!({
            "mode": request.mode.clone().unwrap_or_else(|| "mock".to_string()),
            "tasks": [
                "API-Readback dokumentieren",
                "Docker/Synapse als partial markieren",
                "DB-Readback nach Docker-Freigabe nachziehen"
            ]
        });
        if let Some(pool) = state.db_pool() {
            let item = db::create_agent_item(pool, request, content)
                .await
                .map_err(AppError::database)?;
            return Ok((
                StatusCode::CREATED,
                Json(AgentAnalyzeResponse {
                    created_items: vec![item],
                }),
            ));
        }
        let mut store = state.write_store()?;
        let item = AgentFeedItem {
            id: store.next_id("agent"),
            group_id: request.group_id,
            item_type: "next_steps".to_string(),
            title: "Mock-Analyse: naechste Schritte".to_string(),
            content,
            source_type: request.source_type,
            source_id: request.source_id,
            priority: "normal".to_string(),
            confidence: 0.75,
            status: "new".to_string(),
            created_at: NOW.to_string(),
        };
        store.agent_feed_items.push(item.clone());
        Ok((
            StatusCode::CREATED,
            Json(AgentAnalyzeResponse {
                created_items: vec![item],
            }),
        ))
    }

    #[utoipa::path(
        get,
        path = "/api/chat/agent/feed",
        params(("groupId" = Option<String>, Query, description = "Optionale Gruppen-ID")),
        responses((status = 200, description = "Agent-Feed", body = AgentFeedListResponse)),
        tag = "agent"
    )]
    pub async fn list_agent_feed(
        Query(filter): Query<GroupFilter>,
        State(state): State<AppState>,
    ) -> Result<Json<AgentFeedListResponse>, AppError> {
        ensure_optional_group_filter(&state, filter.group_id.as_deref()).await?;
        if let Some(pool) = state.db_pool() {
            return Ok(Json(AgentFeedListResponse {
                items: db::list_agent_feed(pool, filter.group_id.as_deref())
                    .await
                    .map_err(AppError::database)?,
            }));
        }
        let store = state.read_store()?;
        let mut source_items = filter_group(
            store.agent_feed_items.clone(),
            filter.group_id.as_deref(),
            |item| &item.group_id,
        );
        source_items.sort_by(|left, right| {
            right
                .created_at
                .cmp(&left.created_at)
                .then_with(|| left.id.cmp(&right.id))
        });
        let items = source_items
            .iter()
            .map(|item| store.agent_summary(item))
            .collect();
        Ok(Json(AgentFeedListResponse { items }))
    }

    #[utoipa::path(
        get,
        path = "/api/chat/agent/feed/{id}",
        params(("id" = String, Path, description = "Agent-Feed-ID")),
        responses((status = 200, description = "Agent-Feed-Item", body = AgentFeedItemDetails)),
        tag = "agent"
    )]
    pub async fn get_agent_feed_item(
        Path(item_id): Path<String>,
        State(state): State<AppState>,
    ) -> Result<Json<AgentFeedItemDetails>, AppError> {
        ensure_agent_feed_item_path(&state, &item_id).await?;
        if let Some(pool) = state.db_pool() {
            let item = db::get_agent_feed_item(pool, &item_id)
                .await
                .map_err(AppError::database)?;
            let feedback = db::feedback_counts(pool, &item.id)
                .await
                .map_err(AppError::database)?;
            return Ok(Json(AgentFeedItemDetails {
                id: item.id,
                group_id: item.group_id,
                item_type: item.item_type,
                title: item.title,
                content: item.content,
                source_type: item.source_type,
                source_id: item.source_id,
                priority: item.priority,
                confidence: item.confidence,
                status: item.status,
                created_at: item.created_at,
                feedback,
            }));
        }
        let store = state.read_store()?;
        let item = store
            .agent_feed_items
            .iter()
            .find(|item| item.id == item_id)
            .ok_or_else(|| AppError::not_found("Agent-Feed-Item wurde nicht gefunden"))?;
        Ok(Json(AgentFeedItemDetails {
            id: item.id.clone(),
            group_id: item.group_id.clone(),
            item_type: item.item_type.clone(),
            title: item.title.clone(),
            content: item.content.clone(),
            source_type: item.source_type.clone(),
            source_id: item.source_id.clone(),
            priority: item.priority.clone(),
            confidence: item.confidence,
            status: item.status.clone(),
            created_at: item.created_at.clone(),
            feedback: store.feedback_counts(&item.id),
        }))
    }

    #[utoipa::path(
        post,
        path = "/api/chat/agent/feed/{id}/feedback",
        params(("id" = String, Path, description = "Agent-Feed-ID")),
        request_body = CreateAgentFeedbackRequest,
        responses(
            (status = 201, description = "Feedback gespeichert", body = AgentFeedback),
            (status = 400, description = "Ungueltige Anfrage", body = ErrorResponse),
            (status = 404, description = "Agent-Feed-Item wurde nicht gefunden", body = ErrorResponse)
        ),
        tag = "agent"
    )]
    pub async fn create_agent_feedback(
        Path(item_id): Path<String>,
        State(state): State<AppState>,
        RequiredJson(request): RequiredJson<CreateAgentFeedbackRequest>,
    ) -> Result<(StatusCode, Json<AgentFeedback>), AppError> {
        if request.value != 1 && request.value != -1 {
            return Err(AppError::bad_request("value muss 1 oder -1 sein", "value"));
        }
        ensure_agent_feed_item_path(&state, &item_id).await?;
        ensure_user_id(&state, &request.user_id, "userId", "userId ist unbekannt").await?;
        if let Some(pool) = state.db_pool() {
            let feedback = db::create_agent_feedback(pool, &item_id, request)
                .await
                .map_err(AppError::database)?;
            return Ok((StatusCode::CREATED, Json(feedback)));
        }
        let mut store = state.write_store()?;
        if !store.agent_feed_items.iter().any(|item| item.id == item_id) {
            return Err(AppError::not_found("Agent-Feed-Item wurde nicht gefunden"));
        }
        let feedback = AgentFeedback {
            id: store.next_id("feedback"),
            agent_feed_item_id: item_id,
            user_id: request.user_id,
            value: request.value,
            reason: request.reason,
            created_at: NOW.to_string(),
        };
        store.agent_feedback.push(feedback.clone());
        Ok((StatusCode::CREATED, Json(feedback)))
    }
}

pub mod matrix {
    use super::*;

    pub fn router() -> Router<AppState> {
        Router::new()
            .route("/matrix/users/link", post(link_matrix_user))
            .route("/matrix/users/{userId}", get(get_matrix_user))
            .route("/matrix/rooms/link", post(link_matrix_room))
            .route("/matrix/rooms", get(list_matrix_rooms))
    }

    #[utoipa::path(
        post,
        path = "/api/chat/matrix/users/link",
        request_body = MatrixUserLinkRequest,
        responses(
            (status = 201, description = "Matrix-User-Link", body = MatrixUserLink),
            (status = 400, description = "Ungueltige Anfrage", body = ErrorResponse)
        ),
        tag = "matrix"
    )]
    pub async fn link_matrix_user(
        State(state): State<AppState>,
        RequiredJson(request): RequiredJson<MatrixUserLinkRequest>,
    ) -> Result<(StatusCode, Json<MatrixUserLink>), AppError> {
        validate_required(&request.user_id, "userId")?;
        validate_matrix_id(&request.matrix_user_id, "matrixUserId", '@')?;
        ensure_user_id(&state, &request.user_id, "userId", "userId ist unbekannt").await?;
        if let Some(pool) = state.db_pool() {
            if db::matrix_user_id_used_by_other_user(
                pool,
                &request.user_id,
                &request.matrix_user_id,
            )
            .await
            .map_err(AppError::database)?
            {
                return Err(AppError::bad_request(
                    "matrixUserId ist bereits einem anderen User zugeordnet",
                    "matrixUserId",
                ));
            }
            let link = db::link_matrix_user(pool, request)
                .await
                .map_err(AppError::database)?;
            return Ok((StatusCode::CREATED, Json(link)));
        }
        let mut store = state.write_store()?;
        if store.matrix_user_links.iter().any(|link| {
            link.matrix_user_id == request.matrix_user_id && link.user_id != request.user_id
        }) {
            return Err(AppError::bad_request(
                "matrixUserId ist bereits einem anderen User zugeordnet",
                "matrixUserId",
            ));
        }
        if let Some(link) = store
            .matrix_user_links
            .iter_mut()
            .find(|link| link.user_id == request.user_id)
        {
            link.matrix_user_id = request.matrix_user_id;
            link.link_status = "linked".to_string();
            link.linked_at = NOW.to_string();
            return Ok((StatusCode::CREATED, Json(link.clone())));
        }
        let link = MatrixUserLink {
            id: store.next_id("mul"),
            user_id: request.user_id,
            matrix_user_id: request.matrix_user_id,
            link_status: "linked".to_string(),
            linked_at: NOW.to_string(),
        };
        store.matrix_user_links.push(link.clone());
        Ok((StatusCode::CREATED, Json(link)))
    }

    #[utoipa::path(
        get,
        path = "/api/chat/matrix/users/{userId}",
        params(("userId" = String, Path, description = "User-ID")),
        responses(
            (status = 200, description = "Matrix-User-Link", body = MatrixUserLink),
            (status = 404, description = "Matrix-User-Link wurde nicht gefunden", body = ErrorResponse)
        ),
        tag = "matrix"
    )]
    pub async fn get_matrix_user(
        Path(user_id): Path<String>,
        State(state): State<AppState>,
    ) -> Result<Json<MatrixUserLink>, AppError> {
        if let Some(pool) = state.db_pool() {
            return db::get_matrix_user(pool, &user_id)
                .await
                .map(Json)
                .map_err(|error| {
                    map_row_not_found(error, "Matrix-User-Link wurde nicht gefunden")
                });
        }
        let store = state.read_store()?;
        store
            .matrix_user_links
            .iter()
            .find(|link| link.user_id == user_id)
            .cloned()
            .map(Json)
            .ok_or_else(|| AppError::not_found("Matrix-User-Link wurde nicht gefunden"))
    }

    #[utoipa::path(
        post,
        path = "/api/chat/matrix/rooms/link",
        request_body = MatrixRoomLinkRequest,
        responses(
            (status = 201, description = "Matrix-Room-Link", body = MatrixRoomLink),
            (status = 400, description = "Ungueltige Anfrage", body = ErrorResponse)
        ),
        tag = "matrix"
    )]
    pub async fn link_matrix_room(
        State(state): State<AppState>,
        RequiredJson(request): RequiredJson<MatrixRoomLinkRequest>,
    ) -> Result<(StatusCode, Json<MatrixRoomLink>), AppError> {
        validate_required(&request.group_id, "groupId")?;
        validate_matrix_id(&request.matrix_room_id, "matrixRoomId", '!')?;
        validate_optional_matrix_alias(request.room_alias.as_deref())?;
        ensure_group_id(&state, &request.group_id).await?;
        if let Some(pool) = state.db_pool() {
            let link = db::link_matrix_room(pool, request)
                .await
                .map_err(AppError::database)?;
            return Ok((StatusCode::CREATED, Json(link)));
        }
        let mut store = state.write_store()?;
        let group_id = request.group_id;
        let matrix_room_id = request.matrix_room_id;
        if request.is_primary {
            for room in &mut store.matrix_room_links {
                if room.group_id == group_id {
                    room.is_primary = false;
                }
            }
            if let Some(group) = store.groups.iter_mut().find(|group| group.id == group_id) {
                group.matrix_room_id = Some(matrix_room_id.clone());
            }
        }
        let link = MatrixRoomLink {
            id: store.next_id("mrl"),
            group_id,
            matrix_room_id,
            room_alias: request.room_alias,
            is_primary: request.is_primary,
            link_status: "linked".to_string(),
            created_at: NOW.to_string(),
        };
        store.matrix_room_links.push(link.clone());
        Ok((StatusCode::CREATED, Json(link)))
    }

    #[utoipa::path(
        get,
        path = "/api/chat/matrix/rooms",
        params(("groupId" = Option<String>, Query, description = "Optionale Gruppen-ID")),
        responses(
            (status = 200, description = "Matrix-Room-Links", body = MatrixRoomListResponse),
            (status = 404, description = "Gruppe wurde nicht gefunden", body = ErrorResponse)
        ),
        tag = "matrix"
    )]
    pub async fn list_matrix_rooms(
        Query(filter): Query<GroupFilter>,
        State(state): State<AppState>,
    ) -> Result<Json<MatrixRoomListResponse>, AppError> {
        ensure_optional_group_filter(&state, filter.group_id.as_deref()).await?;
        if let Some(pool) = state.db_pool() {
            return Ok(Json(MatrixRoomListResponse {
                rooms: db::list_matrix_rooms(pool, filter.group_id.as_deref())
                    .await
                    .map_err(AppError::database)?,
            }));
        }
        let store = state.read_store()?;
        Ok(Json(MatrixRoomListResponse {
            rooms: filter_group(
                store.matrix_room_links.clone(),
                filter.group_id.as_deref(),
                |room| &room.group_id,
            ),
        }))
    }
}

pub mod dashboard {
    use super::*;

    pub fn router() -> Router<AppState> {
        Router::new().route("/dashboard", get(dashboard))
    }

    #[utoipa::path(
        get,
        path = "/api/chat/dashboard",
        responses((status = 200, description = "Kommunikations-Dashboard", body = DashboardResponse)),
        tag = "dashboard"
    )]
    pub async fn dashboard(
        State(state): State<AppState>,
    ) -> Result<Json<DashboardResponse>, AppError> {
        if let Some(pool) = state.db_pool() {
            let groups = db::list_groups(pool).await.map_err(AppError::database)?;
            let feed = db::list_feed(pool, None)
                .await
                .map_err(AppError::database)?;
            let wiki = db::list_wiki(pool, None)
                .await
                .map_err(AppError::database)?;
            let agent_feed = db::list_agent_feed(pool, None)
                .await
                .map_err(AppError::database)?;
            let nodes = db::list_knowledge_nodes(pool)
                .await
                .map_err(AppError::database)?;
            let edges = db::list_knowledge_edges(pool)
                .await
                .map_err(AppError::database)?;
            let has_matrix_room_links = db::matrix_room_links_configured(pool)
                .await
                .map_err(AppError::database)?;
            return Ok(Json(DashboardResponse {
                status: DashboardStatus {
                    api: "ok".to_string(),
                    database: state.data_source_label().to_string(),
                    matrix: matrix_status(has_matrix_room_links),
                    llm: "mock".to_string(),
                    user_adapter: "dummy".to_string(),
                },
                groups,
                feed,
                wiki,
                agent_feed,
                knowledge_graph: DashboardKnowledgeGraph {
                    node_count: nodes.len(),
                    edge_count: edges.len(),
                },
            }));
        }
        let store = state.read_store()?;
        let mut agent_source_items = store.agent_feed_items.clone();
        agent_source_items.sort_by(|left, right| {
            right
                .created_at
                .cmp(&left.created_at)
                .then_with(|| left.id.cmp(&right.id))
        });
        let agent_feed = agent_source_items
            .iter()
            .map(|item| store.agent_summary(item))
            .collect();
        let mut wiki: Vec<_> = store
            .wiki_articles
            .clone()
            .into_iter()
            .map(WikiArticleSummary::from)
            .collect();
        sort_wiki_summaries_desc(&mut wiki);
        let mut feed = store.feed_items.clone();
        sort_feed_desc(&mut feed);
        Ok(Json(DashboardResponse {
            status: DashboardStatus {
                api: "ok".to_string(),
                database: state.data_source_label().to_string(),
                matrix: matrix_status(!store.matrix_room_links.is_empty()),
                llm: "mock".to_string(),
                user_adapter: "dummy".to_string(),
            },
            groups: store.groups_with_primary_matrix_rooms(),
            feed,
            wiki,
            agent_feed,
            knowledge_graph: DashboardKnowledgeGraph {
                node_count: store.knowledge_nodes.len(),
                edge_count: store.knowledge_edges.len(),
            },
        }))
    }
}

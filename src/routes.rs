use axum::{
    Json, Router,
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post},
};
use serde::Deserialize;
use serde_json::json;

use crate::{db, error::AppError, models::*, seed::NOW, state::AppState};

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
                .map_err(AppError::database);
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
            groups: store.groups.clone(),
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
        Json(request): Json<CreateGroupRequest>,
    ) -> Result<(StatusCode, Json<Group>), AppError> {
        if request.name.trim().is_empty() {
            return Err(AppError::bad_request("name ist erforderlich", "name"));
        }
        if let Some(pool) = state.db_pool() {
            let group = db::create_group(pool, request)
                .await
                .map_err(AppError::database)?;
            return Ok((StatusCode::CREATED, Json(group)));
        }

        let mut store = state.write_store()?;
        if !store
            .users
            .iter()
            .any(|user| user.id == request.created_by_user_id)
        {
            return Err(AppError::bad_request(
                "createdByUserId ist unbekannt",
                "createdByUserId",
            ));
        }

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
            (status = 404, description = "Gruppe oder User wurde nicht gefunden", body = ErrorResponse)
        ),
        tag = "groups"
    )]
    pub async fn add_group_member(
        Path(group_id): Path<String>,
        State(state): State<AppState>,
        Json(request): Json<AddGroupMemberRequest>,
    ) -> Result<(StatusCode, Json<GroupMember>), AppError> {
        if let Some(pool) = state.db_pool() {
            let member = db::add_group_member(pool, &group_id, request)
                .await
                .map_err(AppError::database)?;
            return Ok((StatusCode::CREATED, Json(member)));
        }
        let mut store = state.write_store()?;
        if !store.users.iter().any(|user| user.id == request.user_id) {
            return Err(AppError::not_found("User wurde nicht gefunden"));
        }
        let group = store
            .groups
            .iter_mut()
            .find(|group| group.id == group_id)
            .ok_or_else(|| AppError::not_found("Gruppe wurde nicht gefunden"))?;
        if !group.member_ids.iter().any(|id| id == &request.user_id) {
            group.member_ids.push(request.user_id.clone());
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
        responses((status = 201, description = "Thread erstellt", body = ThreadItem)),
        tag = "threads"
    )]
    pub async fn create_thread(
        State(state): State<AppState>,
        Json(request): Json<CreateThreadRequest>,
    ) -> Result<(StatusCode, Json<ThreadItem>), AppError> {
        if let Some(pool) = state.db_pool() {
            let thread = db::create_thread(pool, request)
                .await
                .map_err(AppError::database)?;
            return Ok((StatusCode::CREATED, Json(thread)));
        }
        let mut store = state.write_store()?;
        if !store
            .groups
            .iter()
            .any(|group| group.id == request.group_id)
        {
            return Err(AppError::not_found("Gruppe wurde nicht gefunden"));
        }
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
        responses((status = 200, description = "Nachrichten", body = MessageListResponse)),
        tag = "threads"
    )]
    pub async fn list_messages(
        Path(thread_id): Path<String>,
        State(state): State<AppState>,
    ) -> Result<Json<MessageListResponse>, AppError> {
        if let Some(pool) = state.db_pool() {
            return Ok(Json(MessageListResponse {
                messages: db::list_messages(pool, &thread_id)
                    .await
                    .map_err(AppError::database)?,
            }));
        }
        let store = state.read_store()?;
        if !store.threads.iter().any(|thread| thread.id == thread_id) {
            return Err(AppError::not_found("Thread wurde nicht gefunden"));
        }
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
        responses((status = 201, description = "Nachricht erstellt", body = Message)),
        tag = "threads"
    )]
    pub async fn create_message(
        Path(thread_id): Path<String>,
        State(state): State<AppState>,
        Json(request): Json<CreateMessageRequest>,
    ) -> Result<(StatusCode, Json<Message>), AppError> {
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
        let matrix_room_id = store
            .matrix_room_links
            .iter()
            .find(|room| room.group_id == thread.group_id && room.is_primary)
            .map(|room| room.matrix_room_id.clone());
        let message = Message {
            id: store.next_id("msg"),
            thread_id,
            matrix_room_id,
            matrix_event_id: Some(store.next_id("event")),
            author_id: request.author_id,
            body: request.body,
            priority_label: "normal".to_string(),
            priority_score: 0.5,
            created_at: NOW.to_string(),
        };
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
        if let Some(pool) = state.db_pool() {
            return Ok(Json(WikiListResponse {
                articles: db::list_wiki(pool, filter.group_id.as_deref())
                    .await
                    .map_err(AppError::database)?,
            }));
        }
        let store = state.read_store()?;
        let articles = filter_group(
            store.wiki_articles.clone(),
            filter.group_id.as_deref(),
            |article| &article.group_id,
        )
        .into_iter()
        .map(WikiArticleSummary::from)
        .collect();
        Ok(Json(WikiListResponse { articles }))
    }

    #[utoipa::path(
        post,
        path = "/api/chat/wiki",
        request_body = CreateWikiArticleRequest,
        responses((status = 201, description = "Wiki-Artikel erstellt", body = WikiArticle)),
        tag = "wiki"
    )]
    pub async fn create_wiki_article(
        State(state): State<AppState>,
        Json(request): Json<CreateWikiArticleRequest>,
    ) -> Result<(StatusCode, Json<WikiArticle>), AppError> {
        if let Some(pool) = state.db_pool() {
            let article = db::create_wiki_article(pool, request)
                .await
                .map_err(AppError::database)?;
            return Ok((StatusCode::CREATED, Json(article)));
        }
        let mut store = state.write_store()?;
        if !store
            .groups
            .iter()
            .any(|group| group.id == request.group_id)
        {
            return Err(AppError::not_found("Gruppe wurde nicht gefunden"));
        }
        let article = WikiArticle {
            id: store.next_id("wiki"),
            group_id: request.group_id,
            title: request.title,
            body: request.body,
            tags: request.tags,
            author_id: request.author_id,
            status: "published".to_string(),
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
        responses((status = 200, description = "Wiki-Artikel", body = WikiArticle)),
        tag = "wiki"
    )]
    pub async fn get_wiki_article(
        Path(article_id): Path<String>,
        State(state): State<AppState>,
    ) -> Result<Json<WikiArticle>, AppError> {
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
        responses((status = 200, description = "Wiki-Artikel aktualisiert", body = UpdateWikiArticleResponse)),
        tag = "wiki"
    )]
    pub async fn update_wiki_article(
        Path(article_id): Path<String>,
        State(state): State<AppState>,
        Json(request): Json<UpdateWikiArticleRequest>,
    ) -> Result<Json<UpdateWikiArticleResponse>, AppError> {
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
        article.updated_at = NOW.to_string();
        Ok(Json(UpdateWikiArticleResponse {
            id: article.id.clone(),
            title: article.title.clone(),
            tags: article.tags.clone(),
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
        if let Some(pool) = state.db_pool() {
            return Ok(Json(FeedListResponse {
                items: db::list_feed(pool, filter.group_id.as_deref())
                    .await
                    .map_err(AppError::database)?,
            }));
        }
        let store = state.read_store()?;
        Ok(Json(FeedListResponse {
            items: filter_group(
                store.feed_items.clone(),
                filter.group_id.as_deref(),
                |item| &item.group_id,
            ),
        }))
    }

    #[utoipa::path(
        post,
        path = "/api/chat/feed/rebuild",
        request_body = FeedRebuildRequest,
        responses((status = 202, description = "Feed-Rebuild angenommen", body = FeedRebuildResponse)),
        tag = "feed"
    )]
    pub async fn rebuild_feed(
        State(state): State<AppState>,
        Json(request): Json<FeedRebuildRequest>,
    ) -> Result<(StatusCode, Json<FeedRebuildResponse>), AppError> {
        if let Some(pool) = state.db_pool() {
            db::group_exists(pool, &request.group_id)
                .await
                .map_err(AppError::database)?;
        } else {
            let store = state.read_store()?;
            if !store
                .groups
                .iter()
                .any(|group| group.id == request.group_id)
            {
                return Err(AppError::not_found("Gruppe wurde nicht gefunden"));
            }
        }
        Ok((
            StatusCode::ACCEPTED,
            Json(FeedRebuildResponse {
                status: "queued".to_string(),
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
        responses((status = 201, description = "Knowledge-Graph-Knoten erstellt", body = KnowledgeNode)),
        tag = "knowledge"
    )]
    pub async fn create_node(
        State(state): State<AppState>,
        Json(request): Json<CreateKnowledgeNodeRequest>,
    ) -> Result<(StatusCode, Json<KnowledgeNode>), AppError> {
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
        responses((status = 201, description = "Knowledge-Graph-Kante erstellt", body = KnowledgeEdge)),
        tag = "knowledge"
    )]
    pub async fn create_edge(
        State(state): State<AppState>,
        Json(request): Json<CreateKnowledgeEdgeRequest>,
    ) -> Result<(StatusCode, Json<KnowledgeEdge>), AppError> {
        if let Some(pool) = state.db_pool() {
            let edge = db::create_knowledge_edge(pool, request)
                .await
                .map_err(AppError::database)?;
            return Ok((StatusCode::CREATED, Json(edge)));
        }
        let mut store = state.write_store()?;
        if !store
            .knowledge_nodes
            .iter()
            .any(|node| node.id == request.from_node_id)
            || !store
                .knowledge_nodes
                .iter()
                .any(|node| node.id == request.to_node_id)
        {
            return Err(AppError::not_found(
                "Knowledge-Graph-Knoten wurde nicht gefunden",
            ));
        }
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
        responses((status = 201, description = "Mock-Agent-Items erzeugt", body = AgentAnalyzeResponse)),
        tag = "agent"
    )]
    pub async fn analyze(
        State(state): State<AppState>,
        Json(request): Json<AgentAnalyzeRequest>,
    ) -> Result<(StatusCode, Json<AgentAnalyzeResponse>), AppError> {
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
        if !store
            .groups
            .iter()
            .any(|group| group.id == request.group_id)
        {
            return Err(AppError::not_found("Gruppe wurde nicht gefunden"));
        }
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
        if let Some(pool) = state.db_pool() {
            return Ok(Json(AgentFeedListResponse {
                items: db::list_agent_feed(pool, filter.group_id.as_deref())
                    .await
                    .map_err(AppError::database)?,
            }));
        }
        let store = state.read_store()?;
        let items = filter_group(
            store.agent_feed_items.clone(),
            filter.group_id.as_deref(),
            |item| &item.group_id,
        )
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
        responses((status = 201, description = "Feedback gespeichert", body = AgentFeedback)),
        tag = "agent"
    )]
    pub async fn create_agent_feedback(
        Path(item_id): Path<String>,
        State(state): State<AppState>,
        Json(request): Json<CreateAgentFeedbackRequest>,
    ) -> Result<(StatusCode, Json<AgentFeedback>), AppError> {
        if request.value != 1 && request.value != -1 {
            return Err(AppError::bad_request("value muss 1 oder -1 sein", "value"));
        }
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
        responses((status = 201, description = "Matrix-User-Link", body = MatrixUserLink)),
        tag = "matrix"
    )]
    pub async fn link_matrix_user(
        State(state): State<AppState>,
        Json(request): Json<MatrixUserLinkRequest>,
    ) -> Result<(StatusCode, Json<MatrixUserLink>), AppError> {
        if let Some(pool) = state.db_pool() {
            let link = db::link_matrix_user(pool, request)
                .await
                .map_err(AppError::database)?;
            return Ok((StatusCode::CREATED, Json(link)));
        }
        let mut store = state.write_store()?;
        if !store.users.iter().any(|user| user.id == request.user_id) {
            return Err(AppError::not_found("User wurde nicht gefunden"));
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
        responses((status = 200, description = "Matrix-User-Link", body = MatrixUserLink)),
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
                .map_err(AppError::database);
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
        responses((status = 201, description = "Matrix-Room-Link", body = MatrixRoomLink)),
        tag = "matrix"
    )]
    pub async fn link_matrix_room(
        State(state): State<AppState>,
        Json(request): Json<MatrixRoomLinkRequest>,
    ) -> Result<(StatusCode, Json<MatrixRoomLink>), AppError> {
        if let Some(pool) = state.db_pool() {
            let link = db::link_matrix_room(pool, request)
                .await
                .map_err(AppError::database)?;
            return Ok((StatusCode::CREATED, Json(link)));
        }
        let mut store = state.write_store()?;
        if !store
            .groups
            .iter()
            .any(|group| group.id == request.group_id)
        {
            return Err(AppError::not_found("Gruppe wurde nicht gefunden"));
        }
        let link = MatrixRoomLink {
            id: store.next_id("mrl"),
            group_id: request.group_id,
            matrix_room_id: request.matrix_room_id,
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
        responses((status = 200, description = "Matrix-Room-Links", body = MatrixRoomListResponse)),
        tag = "matrix"
    )]
    pub async fn list_matrix_rooms(
        Query(filter): Query<GroupFilter>,
        State(state): State<AppState>,
    ) -> Result<Json<MatrixRoomListResponse>, AppError> {
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
            return Ok(Json(DashboardResponse {
                status: DashboardStatus {
                    api: "ok".to_string(),
                    database: state.data_source_label().to_string(),
                    matrix: "linked".to_string(),
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
        let agent_feed = store
            .agent_feed_items
            .iter()
            .map(|item| store.agent_summary(item))
            .collect();
        let wiki = store
            .wiki_articles
            .clone()
            .into_iter()
            .map(WikiArticleSummary::from)
            .collect();
        Ok(Json(DashboardResponse {
            status: DashboardStatus {
                api: "ok".to_string(),
                database: state.data_source_label().to_string(),
                matrix: "linked".to_string(),
                llm: "mock".to_string(),
                user_adapter: "dummy".to_string(),
            },
            groups: store.groups.clone(),
            feed: store.feed_items.clone(),
            wiki,
            agent_feed,
            knowledge_graph: DashboardKnowledgeGraph {
                node_count: store.knowledge_nodes.len(),
                edge_count: store.knowledge_edges.len(),
            },
        }))
    }
}

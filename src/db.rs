use std::time::{SystemTime, UNIX_EPOCH};

use serde_json::Value;
use sqlx::{PgPool, Row, postgres::PgPoolOptions};

use crate::models::*;

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./migrations");

pub async fn connect(database_url: &str) -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(5)
        .connect(database_url)
        .await
}

pub async fn migrate(pool: &PgPool) -> Result<(), sqlx::migrate::MigrateError> {
    MIGRATOR.run(pool).await
}

fn new_id(prefix: &str) -> String {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or_default();
    format!("{prefix}-{nanos}")
}

fn string_at(row: &sqlx::postgres::PgRow, column: &str) -> String {
    row.get::<String, _>(column)
}

fn optional_string_at(row: &sqlx::postgres::PgRow, column: &str) -> Option<String> {
    row.try_get::<Option<String>, _>(column).ok().flatten()
}

fn group_from_row(row: sqlx::postgres::PgRow, member_ids: Vec<String>) -> Group {
    Group {
        id: string_at(&row, "id"),
        name: string_at(&row, "name"),
        description: string_at(&row, "description"),
        member_ids,
        matrix_room_id: optional_string_at(&row, "matrix_room_id"),
        created_at: string_at(&row, "created_at"),
    }
}

fn user_from_row(row: sqlx::postgres::PgRow) -> UserRef {
    UserRef {
        id: string_at(&row, "id"),
        display_name: string_at(&row, "display_name"),
        role: string_at(&row, "role"),
        source: string_at(&row, "source"),
    }
}

fn thread_from_row(row: sqlx::postgres::PgRow) -> ThreadItem {
    ThreadItem {
        id: string_at(&row, "id"),
        group_id: string_at(&row, "group_id"),
        title: string_at(&row, "title"),
        thread_type: string_at(&row, "type"),
        status: string_at(&row, "status"),
        created_by: string_at(&row, "created_by_user_id"),
        created_at: string_at(&row, "created_at"),
    }
}

fn message_from_row(row: sqlx::postgres::PgRow) -> Message {
    Message {
        id: string_at(&row, "id"),
        thread_id: string_at(&row, "thread_id"),
        matrix_room_id: optional_string_at(&row, "matrix_room_id"),
        matrix_event_id: optional_string_at(&row, "matrix_event_id"),
        author_id: string_at(&row, "author_user_id"),
        body: string_at(&row, "body"),
        priority_label: string_at(&row, "priority_label"),
        priority_score: row.get::<f32, _>("priority_score"),
        created_at: string_at(&row, "created_at"),
    }
}

fn wiki_from_row(row: sqlx::postgres::PgRow) -> WikiArticle {
    WikiArticle {
        id: string_at(&row, "id"),
        group_id: string_at(&row, "group_id"),
        title: string_at(&row, "title"),
        body: string_at(&row, "body"),
        tags: row.get::<Vec<String>, _>("tags"),
        author_id: string_at(&row, "author_user_id"),
        status: string_at(&row, "status"),
        created_at: string_at(&row, "created_at"),
        updated_at: string_at(&row, "updated_at"),
    }
}

fn feed_from_row(row: sqlx::postgres::PgRow) -> FeedItem {
    FeedItem {
        id: string_at(&row, "id"),
        group_id: string_at(&row, "group_id"),
        source_type: string_at(&row, "source_type"),
        source_id: string_at(&row, "source_id"),
        title: string_at(&row, "title"),
        summary: string_at(&row, "summary"),
        priority: string_at(&row, "priority"),
        created_at: string_at(&row, "created_at"),
    }
}

fn node_from_row(row: sqlx::postgres::PgRow) -> KnowledgeNode {
    KnowledgeNode {
        id: string_at(&row, "id"),
        node_type: string_at(&row, "type"),
        title: string_at(&row, "title"),
        summary: string_at(&row, "summary"),
        source_type: string_at(&row, "source_type"),
        source_id: string_at(&row, "source_id"),
    }
}

fn edge_from_row(row: sqlx::postgres::PgRow) -> KnowledgeEdge {
    KnowledgeEdge {
        id: string_at(&row, "id"),
        from_node_id: string_at(&row, "from_node_id"),
        to_node_id: string_at(&row, "to_node_id"),
        relation: string_at(&row, "relation"),
        confidence: row.get::<f32, _>("confidence"),
        source_type: string_at(&row, "source_type"),
        source_id: string_at(&row, "source_id"),
    }
}

fn agent_from_row(row: sqlx::postgres::PgRow) -> AgentFeedItem {
    AgentFeedItem {
        id: string_at(&row, "id"),
        group_id: string_at(&row, "group_id"),
        item_type: string_at(&row, "item_type"),
        title: string_at(&row, "title"),
        content: row.get::<Value, _>("content"),
        source_type: string_at(&row, "source_type"),
        source_id: string_at(&row, "source_id"),
        priority: string_at(&row, "priority"),
        confidence: row.get::<f32, _>("confidence"),
        status: string_at(&row, "status"),
        created_at: string_at(&row, "created_at"),
    }
}

fn room_link_from_row(row: sqlx::postgres::PgRow) -> MatrixRoomLink {
    MatrixRoomLink {
        id: string_at(&row, "id"),
        group_id: string_at(&row, "group_id"),
        matrix_room_id: string_at(&row, "matrix_room_id"),
        room_alias: optional_string_at(&row, "room_alias"),
        is_primary: row.get::<bool, _>("is_primary"),
        link_status: string_at(&row, "link_status"),
        created_at: string_at(&row, "created_at"),
    }
}

fn user_link_from_row(row: sqlx::postgres::PgRow) -> MatrixUserLink {
    MatrixUserLink {
        id: string_at(&row, "id"),
        user_id: string_at(&row, "user_id"),
        matrix_user_id: string_at(&row, "matrix_user_id"),
        link_status: string_at(&row, "link_status"),
        linked_at: string_at(&row, "linked_at"),
    }
}

fn feedback_from_row(row: sqlx::postgres::PgRow) -> AgentFeedback {
    AgentFeedback {
        id: string_at(&row, "id"),
        agent_feed_item_id: string_at(&row, "agent_feed_item_id"),
        user_id: string_at(&row, "user_id"),
        value: row.get::<i16, _>("value"),
        reason: optional_string_at(&row, "reason"),
        created_at: string_at(&row, "created_at"),
    }
}

pub async fn list_users(pool: &PgPool) -> Result<Vec<UserRef>, sqlx::Error> {
    let rows = sqlx::query("SELECT id, display_name, role, source FROM users_cache ORDER BY id")
        .fetch_all(pool)
        .await?;
    Ok(rows.into_iter().map(user_from_row).collect())
}

pub async fn get_user(pool: &PgPool, user_id: &str) -> Result<UserRef, sqlx::Error> {
    sqlx::query("SELECT id, display_name, role, source FROM users_cache WHERE id = $1")
        .bind(user_id)
        .fetch_one(pool)
        .await
        .map(user_from_row)
}

async fn member_ids(pool: &PgPool, group_id: &str) -> Result<Vec<String>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT user_id FROM group_members WHERE group_id = $1 ORDER BY joined_at, user_id",
    )
    .bind(group_id)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(|row| string_at(&row, "user_id"))
        .collect())
}

pub async fn list_groups(pool: &PgPool) -> Result<Vec<Group>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT g.id, g.name, g.description, g.created_at::text AS created_at,
               primary_room.matrix_room_id
        FROM groups g
        LEFT JOIN LATERAL (
            SELECT matrix_room_id
            FROM matrix_room_links
            WHERE group_id = g.id AND is_primary
            LIMIT 1
        ) primary_room ON true
        ORDER BY g.created_at, g.id
        "#,
    )
    .fetch_all(pool)
    .await?;

    let mut groups = Vec::with_capacity(rows.len());
    for row in rows {
        let ids = member_ids(pool, &string_at(&row, "id")).await?;
        groups.push(group_from_row(row, ids));
    }
    Ok(groups)
}

pub async fn create_group(
    pool: &PgPool,
    request: CreateGroupRequest,
) -> Result<Group, sqlx::Error> {
    get_user(pool, &request.created_by_user_id).await?;
    let id = new_id("group");
    let row = sqlx::query(
        r#"
        INSERT INTO groups (id, name, description, created_by_user_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, description, created_at::text AS created_at, NULL::text AS matrix_room_id
        "#,
    )
    .bind(&id)
    .bind(&request.name)
    .bind(&request.description)
    .bind(&request.created_by_user_id)
    .fetch_one(pool)
    .await?;

    sqlx::query(
        "INSERT INTO group_members (group_id, user_id, member_role) VALUES ($1, $2, 'owner')",
    )
    .bind(&id)
    .bind(&request.created_by_user_id)
    .execute(pool)
    .await?;

    Ok(group_from_row(row, vec![request.created_by_user_id]))
}

pub async fn get_group_details(pool: &PgPool, group_id: &str) -> Result<GroupDetails, sqlx::Error> {
    let group = sqlx::query("SELECT id, name, description FROM groups WHERE id = $1")
        .bind(group_id)
        .fetch_one(pool)
        .await?;
    let members = sqlx::query(
        r#"
        SELECT gm.user_id, u.display_name, gm.member_role
        FROM group_members gm
        JOIN users_cache u ON u.id = gm.user_id
        WHERE gm.group_id = $1
        ORDER BY gm.joined_at, gm.user_id
        "#,
    )
    .bind(group_id)
    .fetch_all(pool)
    .await?
    .into_iter()
    .map(|row| GroupMemberDetail {
        user_id: string_at(&row, "user_id"),
        display_name: string_at(&row, "display_name"),
        member_role: string_at(&row, "member_role"),
    })
    .collect();
    let matrix_room = sqlx::query(
        r#"
        SELECT matrix_room_id, room_alias, link_status
        FROM matrix_room_links
        WHERE group_id = $1 AND is_primary
        LIMIT 1
        "#,
    )
    .bind(group_id)
    .fetch_optional(pool)
    .await?
    .map(|row| MatrixRoomSummary {
        matrix_room_id: string_at(&row, "matrix_room_id"),
        room_alias: optional_string_at(&row, "room_alias"),
        link_status: string_at(&row, "link_status"),
    });

    Ok(GroupDetails {
        id: string_at(&group, "id"),
        name: string_at(&group, "name"),
        description: string_at(&group, "description"),
        members,
        matrix_room,
    })
}

pub async fn add_group_member(
    pool: &PgPool,
    group_id: &str,
    request: AddGroupMemberRequest,
) -> Result<GroupMember, sqlx::Error> {
    get_user(pool, &request.user_id).await?;
    sqlx::query("SELECT id FROM groups WHERE id = $1")
        .bind(group_id)
        .fetch_one(pool)
        .await?;
    let row = sqlx::query(
        r#"
        INSERT INTO group_members (group_id, user_id, member_role)
        VALUES ($1, $2, $3)
        ON CONFLICT (group_id, user_id) DO UPDATE SET member_role = EXCLUDED.member_role
        RETURNING group_id, user_id, member_role, joined_at::text AS joined_at
        "#,
    )
    .bind(group_id)
    .bind(&request.user_id)
    .bind(&request.member_role)
    .fetch_one(pool)
    .await?;
    Ok(GroupMember {
        group_id: string_at(&row, "group_id"),
        user_id: string_at(&row, "user_id"),
        member_role: string_at(&row, "member_role"),
        joined_at: string_at(&row, "joined_at"),
    })
}

pub async fn list_threads(
    pool: &PgPool,
    group_id: Option<&str>,
) -> Result<Vec<ThreadItem>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT id, group_id, title, type, created_by_user_id, status, created_at::text AS created_at
        FROM threads
        WHERE ($1::text IS NULL OR group_id = $1)
        ORDER BY created_at, id
        "#,
    )
    .bind(group_id)
    .fetch_all(pool)
    .await?;
    Ok(rows.into_iter().map(thread_from_row).collect())
}

pub async fn create_thread(
    pool: &PgPool,
    request: CreateThreadRequest,
) -> Result<ThreadItem, sqlx::Error> {
    let id = new_id("thread");
    let row = sqlx::query(
        r#"
        INSERT INTO threads (id, group_id, title, type, created_by_user_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, group_id, title, type, created_by_user_id, status, created_at::text AS created_at
        "#,
    )
    .bind(&id)
    .bind(&request.group_id)
    .bind(&request.title)
    .bind(&request.thread_type)
    .bind(&request.created_by)
    .fetch_one(pool)
    .await?;
    Ok(thread_from_row(row))
}

pub async fn list_messages(pool: &PgPool, thread_id: &str) -> Result<Vec<Message>, sqlx::Error> {
    sqlx::query("SELECT id FROM threads WHERE id = $1")
        .bind(thread_id)
        .fetch_one(pool)
        .await?;
    let rows = sqlx::query(
        r#"
        SELECT id, thread_id, matrix_room_id, matrix_event_id, author_user_id, body,
               priority_label, priority_score, created_at::text AS created_at
        FROM messages_cache
        WHERE thread_id = $1
        ORDER BY created_at, id
        "#,
    )
    .bind(thread_id)
    .fetch_all(pool)
    .await?;
    Ok(rows.into_iter().map(message_from_row).collect())
}

pub async fn create_message(
    pool: &PgPool,
    thread_id: &str,
    request: CreateMessageRequest,
) -> Result<Message, sqlx::Error> {
    let thread = sqlx::query("SELECT group_id FROM threads WHERE id = $1")
        .bind(thread_id)
        .fetch_one(pool)
        .await?;
    let group_id = string_at(&thread, "group_id");
    let matrix_room_id = sqlx::query(
        "SELECT matrix_room_id FROM matrix_room_links WHERE group_id = $1 AND is_primary LIMIT 1",
    )
    .bind(&group_id)
    .fetch_optional(pool)
    .await?
    .map(|row| string_at(&row, "matrix_room_id"));
    let id = new_id("msg");
    let event_id = new_id("event");
    let row = sqlx::query(
        r#"
        INSERT INTO messages_cache
            (id, thread_id, matrix_room_id, matrix_event_id, author_user_id, body)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, thread_id, matrix_room_id, matrix_event_id, author_user_id, body,
                  priority_label, priority_score, created_at::text AS created_at
        "#,
    )
    .bind(&id)
    .bind(thread_id)
    .bind(&matrix_room_id)
    .bind(&event_id)
    .bind(&request.author_id)
    .bind(&request.body)
    .fetch_one(pool)
    .await?;
    Ok(message_from_row(row))
}

pub async fn list_wiki(
    pool: &PgPool,
    group_id: Option<&str>,
) -> Result<Vec<WikiArticleSummary>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT id, group_id, title, body, tags, author_user_id, status,
               created_at::text AS created_at, updated_at::text AS updated_at
        FROM wiki_articles
        WHERE ($1::text IS NULL OR group_id = $1)
        ORDER BY updated_at DESC, id
        "#,
    )
    .bind(group_id)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(wiki_from_row)
        .map(Into::into)
        .collect())
}

pub async fn create_wiki_article(
    pool: &PgPool,
    request: CreateWikiArticleRequest,
) -> Result<WikiArticle, sqlx::Error> {
    let id = new_id("wiki");
    let row = sqlx::query(
        r#"
        INSERT INTO wiki_articles (id, group_id, title, body, tags, author_user_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, group_id, title, body, tags, author_user_id, status,
                  created_at::text AS created_at, updated_at::text AS updated_at
        "#,
    )
    .bind(&id)
    .bind(&request.group_id)
    .bind(&request.title)
    .bind(&request.body)
    .bind(&request.tags)
    .bind(&request.author_id)
    .fetch_one(pool)
    .await?;
    Ok(wiki_from_row(row))
}

pub async fn get_wiki_article(pool: &PgPool, id: &str) -> Result<WikiArticle, sqlx::Error> {
    sqlx::query(
        r#"
        SELECT id, group_id, title, body, tags, author_user_id, status,
               created_at::text AS created_at, updated_at::text AS updated_at
        FROM wiki_articles
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_one(pool)
    .await
    .map(wiki_from_row)
}

pub async fn update_wiki_article(
    pool: &PgPool,
    id: &str,
    request: UpdateWikiArticleRequest,
) -> Result<UpdateWikiArticleResponse, sqlx::Error> {
    let row = sqlx::query(
        r#"
        UPDATE wiki_articles
        SET title = $2, body = $3, tags = $4, updated_at = now()
        WHERE id = $1
        RETURNING id, title, tags, updated_at::text AS updated_at
        "#,
    )
    .bind(id)
    .bind(&request.title)
    .bind(&request.body)
    .bind(&request.tags)
    .fetch_one(pool)
    .await?;
    Ok(UpdateWikiArticleResponse {
        id: string_at(&row, "id"),
        title: string_at(&row, "title"),
        tags: row.get::<Vec<String>, _>("tags"),
        updated_at: string_at(&row, "updated_at"),
    })
}

pub async fn list_feed(
    pool: &PgPool,
    group_id: Option<&str>,
) -> Result<Vec<FeedItem>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT id, group_id, source_type, source_id, title, summary, priority,
               created_at::text AS created_at
        FROM feed_items
        WHERE ($1::text IS NULL OR group_id = $1)
        ORDER BY created_at DESC, id
        "#,
    )
    .bind(group_id)
    .fetch_all(pool)
    .await?;
    Ok(rows.into_iter().map(feed_from_row).collect())
}

pub async fn group_exists(pool: &PgPool, group_id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("SELECT id FROM groups WHERE id = $1")
        .bind(group_id)
        .fetch_one(pool)
        .await
        .map(|_| ())
}

pub async fn list_knowledge_nodes(pool: &PgPool) -> Result<Vec<KnowledgeNode>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT id, type, title, summary, source_type, source_id FROM knowledge_nodes ORDER BY id",
    )
    .fetch_all(pool)
    .await?;
    Ok(rows.into_iter().map(node_from_row).collect())
}

pub async fn create_knowledge_node(
    pool: &PgPool,
    request: CreateKnowledgeNodeRequest,
) -> Result<KnowledgeNode, sqlx::Error> {
    let id = new_id("node");
    let row = sqlx::query(
        r#"
        INSERT INTO knowledge_nodes (id, type, title, summary, source_type, source_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, type, title, summary, source_type, source_id
        "#,
    )
    .bind(&id)
    .bind(&request.node_type)
    .bind(&request.title)
    .bind(&request.summary)
    .bind(&request.source_type)
    .bind(&request.source_id)
    .fetch_one(pool)
    .await?;
    Ok(node_from_row(row))
}

pub async fn list_knowledge_edges(pool: &PgPool) -> Result<Vec<KnowledgeEdge>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT id, from_node_id, to_node_id, relation, confidence, source_type, source_id
        FROM knowledge_edges
        ORDER BY id
        "#,
    )
    .fetch_all(pool)
    .await?;
    Ok(rows.into_iter().map(edge_from_row).collect())
}

pub async fn create_knowledge_edge(
    pool: &PgPool,
    request: CreateKnowledgeEdgeRequest,
) -> Result<KnowledgeEdge, sqlx::Error> {
    let id = new_id("edge");
    let row = sqlx::query(
        r#"
        INSERT INTO knowledge_edges
            (id, from_node_id, to_node_id, relation, confidence, source_type, source_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, from_node_id, to_node_id, relation, confidence, source_type, source_id
        "#,
    )
    .bind(&id)
    .bind(&request.from_node_id)
    .bind(&request.to_node_id)
    .bind(&request.relation)
    .bind(request.confidence)
    .bind(&request.source_type)
    .bind(&request.source_id)
    .fetch_one(pool)
    .await?;
    Ok(edge_from_row(row))
}

pub async fn list_agent_feed(
    pool: &PgPool,
    group_id: Option<&str>,
) -> Result<Vec<AgentFeedSummary>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT afi.id, afi.group_id, afi.item_type, afi.title, afi.priority, afi.status,
               COALESCE(SUM(CASE WHEN af.value > 0 THEN 1 ELSE 0 END), 0)::int AS up,
               COALESCE(SUM(CASE WHEN af.value < 0 THEN 1 ELSE 0 END), 0)::int AS down
        FROM agent_feed_items afi
        LEFT JOIN agent_feedback af ON af.agent_feed_item_id = afi.id
        WHERE ($1::text IS NULL OR afi.group_id = $1)
        GROUP BY afi.id, afi.group_id, afi.item_type, afi.title, afi.priority, afi.status, afi.created_at
        ORDER BY afi.created_at DESC, afi.id
        "#,
    )
    .bind(group_id)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(|row| AgentFeedSummary {
            id: string_at(&row, "id"),
            group_id: string_at(&row, "group_id"),
            item_type: string_at(&row, "item_type"),
            title: string_at(&row, "title"),
            priority: string_at(&row, "priority"),
            status: string_at(&row, "status"),
            feedback: AgentFeedbackCounts {
                up: row.get::<i32, _>("up") as usize,
                down: row.get::<i32, _>("down") as usize,
            },
        })
        .collect())
}

pub async fn get_agent_feed_item(pool: &PgPool, id: &str) -> Result<AgentFeedItem, sqlx::Error> {
    sqlx::query(
        r#"
        SELECT id, group_id, item_type, title, content, source_type, source_id, priority,
               confidence, status, created_at::text AS created_at
        FROM agent_feed_items
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_one(pool)
    .await
    .map(agent_from_row)
}

pub async fn feedback_counts(
    pool: &PgPool,
    agent_feed_item_id: &str,
) -> Result<AgentFeedbackCounts, sqlx::Error> {
    let row = sqlx::query(
        r#"
        SELECT
            COALESCE(SUM(CASE WHEN value > 0 THEN 1 ELSE 0 END), 0)::int AS up,
            COALESCE(SUM(CASE WHEN value < 0 THEN 1 ELSE 0 END), 0)::int AS down
        FROM agent_feedback
        WHERE agent_feed_item_id = $1
        "#,
    )
    .bind(agent_feed_item_id)
    .fetch_one(pool)
    .await?;
    Ok(AgentFeedbackCounts {
        up: row.get::<i32, _>("up") as usize,
        down: row.get::<i32, _>("down") as usize,
    })
}

pub async fn create_agent_item(
    pool: &PgPool,
    request: AgentAnalyzeRequest,
    content: Value,
) -> Result<AgentFeedItem, sqlx::Error> {
    group_exists(pool, &request.group_id).await?;
    let id = new_id("agent");
    let row = sqlx::query(
        r#"
        INSERT INTO agent_feed_items
            (id, group_id, item_type, title, content, source_type, source_id, priority, confidence)
        VALUES ($1, $2, 'next_steps', 'Mock-Analyse: naechste Schritte', $3, $4, $5, 'normal', 0.75)
        RETURNING id, group_id, item_type, title, content, source_type, source_id, priority,
                  confidence, status, created_at::text AS created_at
        "#,
    )
    .bind(&id)
    .bind(&request.group_id)
    .bind(content)
    .bind(&request.source_type)
    .bind(&request.source_id)
    .fetch_one(pool)
    .await?;
    Ok(agent_from_row(row))
}

pub async fn create_agent_feedback(
    pool: &PgPool,
    item_id: &str,
    request: CreateAgentFeedbackRequest,
) -> Result<AgentFeedback, sqlx::Error> {
    get_agent_feed_item(pool, item_id).await?;
    let id = new_id("feedback");
    let row = sqlx::query(
        r#"
        INSERT INTO agent_feedback (id, agent_feed_item_id, user_id, value, reason)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, agent_feed_item_id, user_id, value, reason, created_at::text AS created_at
        "#,
    )
    .bind(&id)
    .bind(item_id)
    .bind(&request.user_id)
    .bind(request.value)
    .bind(&request.reason)
    .fetch_one(pool)
    .await?;
    Ok(feedback_from_row(row))
}

pub async fn link_matrix_user(
    pool: &PgPool,
    request: MatrixUserLinkRequest,
) -> Result<MatrixUserLink, sqlx::Error> {
    get_user(pool, &request.user_id).await?;
    let id = new_id("mul");
    let row = sqlx::query(
        r#"
        INSERT INTO matrix_user_links (id, user_id, matrix_user_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id) DO UPDATE
            SET matrix_user_id = EXCLUDED.matrix_user_id, link_status = 'linked', linked_at = now()
        RETURNING id, user_id, matrix_user_id, link_status, linked_at::text AS linked_at
        "#,
    )
    .bind(&id)
    .bind(&request.user_id)
    .bind(&request.matrix_user_id)
    .fetch_one(pool)
    .await?;
    Ok(user_link_from_row(row))
}

pub async fn get_matrix_user(pool: &PgPool, user_id: &str) -> Result<MatrixUserLink, sqlx::Error> {
    sqlx::query(
        r#"
        SELECT id, user_id, matrix_user_id, link_status, linked_at::text AS linked_at
        FROM matrix_user_links
        WHERE user_id = $1
        "#,
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
    .map(user_link_from_row)
}

pub async fn link_matrix_room(
    pool: &PgPool,
    request: MatrixRoomLinkRequest,
) -> Result<MatrixRoomLink, sqlx::Error> {
    group_exists(pool, &request.group_id).await?;
    let id = new_id("mrl");
    let row = sqlx::query(
        r#"
        WITH demote_primary AS (
            UPDATE matrix_room_links
            SET is_primary = false
            WHERE group_id = $2 AND $5
            RETURNING id
        )
        INSERT INTO matrix_room_links
            (id, group_id, matrix_room_id, room_alias, is_primary)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, group_id, matrix_room_id, room_alias, is_primary, link_status,
                  created_at::text AS created_at
        "#,
    )
    .bind(&id)
    .bind(&request.group_id)
    .bind(&request.matrix_room_id)
    .bind(&request.room_alias)
    .bind(request.is_primary)
    .fetch_one(pool)
    .await?;
    Ok(room_link_from_row(row))
}

pub async fn list_matrix_rooms(
    pool: &PgPool,
    group_id: Option<&str>,
) -> Result<Vec<MatrixRoomLink>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT id, group_id, matrix_room_id, room_alias, is_primary, link_status,
               created_at::text AS created_at
        FROM matrix_room_links
        WHERE ($1::text IS NULL OR group_id = $1)
        ORDER BY created_at, id
        "#,
    )
    .bind(group_id)
    .fetch_all(pool)
    .await?;
    Ok(rows.into_iter().map(room_link_from_row).collect())
}

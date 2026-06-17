use serde_json::json;

use crate::{
    models::{
        AgentFeedItem, AgentFeedback, FeedItem, Group, GroupMember, KnowledgeEdge, KnowledgeNode,
        MatrixEventLink, MatrixRoomLink, MatrixUserLink, Message, ThreadItem, UserRef, WikiArticle,
    },
    state::MockStore,
};

pub const NOW: &str = "2026-06-17T10:30:00Z";

pub fn mock_store() -> MockStore {
    let users = vec![
        UserRef::dummy("user-david", "David", "architect"),
        UserRef::dummy("user-samira", "Samira", "backend"),
        UserRef::dummy("user-leyla", "Leyla", "frontend"),
    ];

    let groups = vec![
        Group {
            id: "group-team-1".to_string(),
            name: "Team 1 Kommunikation".to_string(),
            description: "Kommunikation, Wissen und Agent-Feed".to_string(),
            member_ids: vec!["user-david".to_string(), "user-samira".to_string()],
            matrix_room_id: Some("!team1:matrix.local".to_string()),
            created_at: "2026-06-17T09:00:00Z".to_string(),
        },
        Group {
            id: "group-demo-support".to_string(),
            name: "Demo Support".to_string(),
            description: "Abstimmung für Demo, Readback und offene Gates".to_string(),
            member_ids: vec!["user-david".to_string(), "user-leyla".to_string()],
            matrix_room_id: Some("!demo-support:matrix.local".to_string()),
            created_at: "2026-06-17T09:05:00Z".to_string(),
        },
    ];

    let group_members = vec![
        member("group-team-1", "user-david", "owner"),
        member("group-team-1", "user-samira", "member"),
        member("group-demo-support", "user-david", "owner"),
        member("group-demo-support", "user-leyla", "member"),
    ];

    let matrix_room_links = vec![
        MatrixRoomLink {
            id: "mrl-1".to_string(),
            group_id: "group-team-1".to_string(),
            matrix_room_id: "!team1:matrix.local".to_string(),
            room_alias: Some("#team-1-kommunikation:matrix.local".to_string()),
            is_primary: true,
            link_status: "linked".to_string(),
            created_at: "2026-06-17T09:10:00Z".to_string(),
        },
        MatrixRoomLink {
            id: "mrl-2".to_string(),
            group_id: "group-demo-support".to_string(),
            matrix_room_id: "!demo-support:matrix.local".to_string(),
            room_alias: Some("#team-1-demo-support:matrix.local".to_string()),
            is_primary: true,
            link_status: "linked".to_string(),
            created_at: "2026-06-17T09:11:00Z".to_string(),
        },
    ];

    let matrix_user_links = vec![
        MatrixUserLink {
            id: "mul-1".to_string(),
            user_id: "user-david".to_string(),
            matrix_user_id: "@david:matrix.local".to_string(),
            link_status: "linked".to_string(),
            linked_at: "2026-06-17T09:12:00Z".to_string(),
        },
        MatrixUserLink {
            id: "mul-2".to_string(),
            user_id: "user-samira".to_string(),
            matrix_user_id: "@samira:matrix.local".to_string(),
            link_status: "linked".to_string(),
            linked_at: "2026-06-17T09:13:00Z".to_string(),
        },
    ];

    let threads = vec![
        thread(
            "thread-architecture",
            "group-team-1",
            "DB-Entscheidung",
            "decision",
            "user-david",
            "2026-06-17T09:20:00Z",
        ),
        thread(
            "thread-matrix-link",
            "group-team-1",
            "Chat-Verknüpfung klären",
            "question",
            "user-samira",
            "2026-06-17T09:30:00Z",
        ),
        thread(
            "thread-demo-flow",
            "group-demo-support",
            "Demo-Readback vorbereiten",
            "discussion",
            "user-leyla",
            "2026-06-17T09:35:00Z",
        ),
    ];

    let messages = vec![
        Message {
            id: "msg-1".to_string(),
            thread_id: "thread-architecture".to_string(),
            matrix_room_id: Some("!team1:matrix.local".to_string()),
            matrix_event_id: Some("$event1".to_string()),
            author_id: "user-david".to_string(),
            body: "PostgreSQL bleibt Modul-Wahrheit, der Chat bleibt der Austausch-Layer."
                .to_string(),
            priority_label: "high".to_string(),
            priority_score: 0.91,
            created_at: "2026-06-17T09:25:00Z".to_string(),
        },
        Message {
            id: "msg-2".to_string(),
            thread_id: "thread-matrix-link".to_string(),
            matrix_room_id: Some("!team1:matrix.local".to_string()),
            matrix_event_id: Some("$event2".to_string()),
            author_id: "user-samira".to_string(),
            body: "Für Submit zuerst vorhandene oder Demo-Räume verlinken.".to_string(),
            priority_label: "normal".to_string(),
            priority_score: 0.66,
            created_at: "2026-06-17T09:36:00Z".to_string(),
        },
    ];

    let matrix_event_links = vec![
        MatrixEventLink {
            id: "mel-1".to_string(),
            matrix_room_link_id: "mrl-1".to_string(),
            matrix_event_id: "$event1".to_string(),
            source_type: "message_cache".to_string(),
            source_id: "msg-1".to_string(),
            created_at: "2026-06-17T09:25:00Z".to_string(),
        },
        MatrixEventLink {
            id: "mel-2".to_string(),
            matrix_room_link_id: "mrl-1".to_string(),
            matrix_event_id: "$event2".to_string(),
            source_type: "message_cache".to_string(),
            source_id: "msg-2".to_string(),
            created_at: "2026-06-17T09:36:00Z".to_string(),
        },
    ];

    let wiki_articles = vec![
        WikiArticle {
            id: "wiki-db-plan".to_string(),
            group_id: "group-team-1".to_string(),
            title: "DB-Plan Kommunikation".to_string(),
            body: "PostgreSQL speichert Gruppen, Wiki, Feed, Graph und Agent-Feedback.".to_string(),
            tags: vec!["db".to_string(), "chat".to_string(), "agent".to_string()],
            author_id: "user-david".to_string(),
            status: "published".to_string(),
            created_at: "2026-06-17T10:00:00Z".to_string(),
            updated_at: "2026-06-17T10:00:00Z".to_string(),
        },
        WikiArticle {
            id: "wiki-matrix-postgres".to_string(),
            group_id: "group-team-1".to_string(),
            title: "Chat und PostgreSQL".to_string(),
            body: "Der Chat ist Austausch-Layer. PostgreSQL bleibt Modul-Wahrheit.".to_string(),
            tags: vec!["chat".to_string(), "postgresql".to_string()],
            author_id: "user-samira".to_string(),
            status: "published".to_string(),
            created_at: "2026-06-17T10:05:00Z".to_string(),
            updated_at: "2026-06-17T10:05:00Z".to_string(),
        },
    ];

    let feed_items = vec![
        feed(
            "feed-1",
            "group-team-1",
            "agent_feed_item",
            "agent-1",
            "Wichtige DB-Entscheidung",
            "PostgreSQL ist Modul-Wahrheit, der Chat bleibt der Austausch-Layer.",
            "high",
            "2026-06-17T10:12:00Z",
        ),
        feed(
            "feed-2",
            "group-team-1",
            "wiki_article",
            "wiki-matrix-postgres",
            "Chat-Linking dokumentiert",
            "User- und Raum-Links bleiben getrennt vom Profil.",
            "normal",
            "2026-06-17T10:13:00Z",
        ),
        feed(
            "feed-3",
            "group-demo-support",
            "thread",
            "thread-demo-flow",
            "Demo-Readback offen",
            "Lokale Checks sind Pflicht, Docker bleibt partial ohne Runtime.",
            "normal",
            "2026-06-17T10:14:00Z",
        ),
    ];

    let knowledge_nodes = vec![
        node(
            "node-user-david",
            "person",
            "David",
            "Architektur",
            "user",
            "user-david",
        ),
        node(
            "node-user-samira",
            "person",
            "Samira",
            "Backend",
            "user",
            "user-samira",
        ),
        node(
            "node-group-team-1",
            "group",
            "Team 1 Kommunikation",
            "Gruppe für Kommunikation und Wissen",
            "group",
            "group-team-1",
        ),
        node(
            "node-thread-architecture",
            "decision",
            "DB-Entscheidung",
            "PostgreSQL bleibt Modul-Wahrheit",
            "thread",
            "thread-architecture",
        ),
        node(
            "node-wiki-matrix-postgres",
            "wiki_article",
            "Chat und PostgreSQL",
            "Trennung Chat-Layer und Modul-Wahrheit",
            "wiki_article",
            "wiki-matrix-postgres",
        ),
        node(
            "node-agent-1",
            "agent_item",
            "Nächste Schritte DB-Integration",
            "Assistenz erzeugt Taskliste",
            "agent_feed_item",
            "agent-1",
        ),
    ];

    let knowledge_edges = vec![
        edge(
            "edge-1",
            "node-user-david",
            "node-group-team-1",
            "member_of",
            "group_member",
            "group-team-1",
        ),
        edge(
            "edge-2",
            "node-user-samira",
            "node-group-team-1",
            "member_of",
            "group_member",
            "group-team-1",
        ),
        edge(
            "edge-3",
            "node-group-team-1",
            "node-thread-architecture",
            "discussed_in",
            "thread",
            "thread-architecture",
        ),
        edge(
            "edge-4",
            "node-thread-architecture",
            "node-wiki-matrix-postgres",
            "references",
            "wiki_article",
            "wiki-matrix-postgres",
        ),
        edge(
            "edge-5",
            "node-agent-1",
            "node-thread-architecture",
            "related_to",
            "agent_feed_item",
            "agent-1",
        ),
    ];

    let agent_feed_items = vec![
        AgentFeedItem {
            id: "agent-1".to_string(),
            group_id: "group-team-1".to_string(),
            item_type: "task_list".to_string(),
            title: "Nächste Schritte DB-Integration".to_string(),
            content: json!({
                "tasks": [
                    "PostgreSQL-Service vorbereiten",
                    "Schema initialisieren",
                    "Chat-Raum-Link testen"
                ]
            }),
            source_type: "thread".to_string(),
            source_id: "thread-architecture".to_string(),
            priority: "high".to_string(),
            confidence: 0.84,
            status: "new".to_string(),
            created_at: "2026-06-17T10:20:00Z".to_string(),
        },
        AgentFeedItem {
            id: "agent-2".to_string(),
            group_id: "group-team-1".to_string(),
            item_type: "message_priority".to_string(),
            title: "Priorität: Chat-Event-Links".to_string(),
            content: json!({"priority": "high", "reason": "Feed, Graph und Agent brauchen stabile Event-Referenzen."}),
            source_type: "message_cache".to_string(),
            source_id: "msg-1".to_string(),
            priority: "high".to_string(),
            confidence: 0.78,
            status: "new".to_string(),
            created_at: "2026-06-17T10:21:00Z".to_string(),
        },
        AgentFeedItem {
            id: "agent-3".to_string(),
            group_id: "group-demo-support".to_string(),
            item_type: "summary".to_string(),
            title: "Readback-Zusammenfassung".to_string(),
            content: json!({"summary": "Health, Useradapter, OpenAPI und Demo-Daten lokal prüfen; Docker/Synapse bleiben externe Gates."}),
            source_type: "thread".to_string(),
            source_id: "thread-demo-flow".to_string(),
            priority: "normal".to_string(),
            confidence: 0.72,
            status: "seen".to_string(),
            created_at: "2026-06-17T10:22:00Z".to_string(),
        },
    ];

    let agent_feedback = vec![
        AgentFeedback {
            id: "feedback-1".to_string(),
            agent_feed_item_id: "agent-1".to_string(),
            user_id: "user-david".to_string(),
            value: 1,
            reason: Some("Hilft für die nächste Umsetzung.".to_string()),
            created_at: "2026-06-17T10:25:00Z".to_string(),
        },
        AgentFeedback {
            id: "feedback-2".to_string(),
            agent_feed_item_id: "agent-2".to_string(),
            user_id: "user-samira".to_string(),
            value: 1,
            reason: Some("Priorisierung ist nachvollziehbar.".to_string()),
            created_at: "2026-06-17T10:26:00Z".to_string(),
        },
    ];

    MockStore::new(
        users,
        groups,
        group_members,
        threads,
        messages,
        wiki_articles,
        feed_items,
        knowledge_nodes,
        knowledge_edges,
        agent_feed_items,
        agent_feedback,
        matrix_user_links,
        matrix_room_links,
        matrix_event_links,
    )
}

fn member(group_id: &str, user_id: &str, member_role: &str) -> GroupMember {
    GroupMember {
        group_id: group_id.to_string(),
        user_id: user_id.to_string(),
        member_role: member_role.to_string(),
        joined_at: "2026-06-17T09:15:00Z".to_string(),
    }
}

fn thread(
    id: &str,
    group_id: &str,
    title: &str,
    thread_type: &str,
    created_by: &str,
    created_at: &str,
) -> ThreadItem {
    ThreadItem {
        id: id.to_string(),
        group_id: group_id.to_string(),
        title: title.to_string(),
        thread_type: thread_type.to_string(),
        status: "open".to_string(),
        created_by: created_by.to_string(),
        created_at: created_at.to_string(),
    }
}

fn feed(
    id: &str,
    group_id: &str,
    source_type: &str,
    source_id: &str,
    title: &str,
    summary: &str,
    priority: &str,
    created_at: &str,
) -> FeedItem {
    FeedItem {
        id: id.to_string(),
        group_id: group_id.to_string(),
        source_type: source_type.to_string(),
        source_id: source_id.to_string(),
        title: title.to_string(),
        summary: summary.to_string(),
        priority: priority.to_string(),
        created_at: created_at.to_string(),
    }
}

fn node(
    id: &str,
    node_type: &str,
    title: &str,
    summary: &str,
    source_type: &str,
    source_id: &str,
) -> KnowledgeNode {
    KnowledgeNode {
        id: id.to_string(),
        node_type: node_type.to_string(),
        title: title.to_string(),
        summary: summary.to_string(),
        source_type: source_type.to_string(),
        source_id: source_id.to_string(),
    }
}

fn edge(
    id: &str,
    from_node_id: &str,
    to_node_id: &str,
    relation: &str,
    source_type: &str,
    source_id: &str,
) -> KnowledgeEdge {
    KnowledgeEdge {
        id: id.to_string(),
        from_node_id: from_node_id.to_string(),
        to_node_id: to_node_id.to_string(),
        relation: relation.to_string(),
        confidence: 1.0,
        source_type: source_type.to_string(),
        source_id: source_id.to_string(),
    }
}

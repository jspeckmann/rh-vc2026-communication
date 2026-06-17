use std::sync::{Arc, RwLock, RwLockReadGuard, RwLockWriteGuard};

use sqlx::PgPool;

use crate::{
    error::AppError,
    models::{
        AgentFeedItem, AgentFeedSummary, AgentFeedback, AgentFeedbackCounts, FeedItem, Group,
        GroupMember, KnowledgeEdge, KnowledgeNode, MatrixEventLink, MatrixRoomLink, MatrixUserLink,
        Message, ThreadItem, UserRef, WikiArticle,
    },
    seed,
};

#[derive(Clone)]
pub struct AppState {
    store: Arc<RwLock<MockStore>>,
    db_pool: Option<PgPool>,
}

impl AppState {
    pub fn mock() -> Self {
        Self {
            store: Arc::new(RwLock::new(seed::mock_store())),
            db_pool: None,
        }
    }

    pub fn with_db_pool(db_pool: PgPool) -> Self {
        Self {
            store: Arc::new(RwLock::new(seed::mock_store())),
            db_pool: Some(db_pool),
        }
    }

    pub fn read_store(&self) -> Result<RwLockReadGuard<'_, MockStore>, AppError> {
        self.store.read().map_err(|_| AppError::StatePoisoned)
    }

    pub fn write_store(&self) -> Result<RwLockWriteGuard<'_, MockStore>, AppError> {
        self.store.write().map_err(|_| AppError::StatePoisoned)
    }

    pub fn db_pool(&self) -> Option<&PgPool> {
        self.db_pool.as_ref()
    }

    pub fn data_source_label(&self) -> &'static str {
        if self.db_pool.is_some() {
            "postgres"
        } else {
            "mock"
        }
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::mock()
    }
}

#[derive(Clone)]
pub struct MockStore {
    pub users: Vec<UserRef>,
    pub groups: Vec<Group>,
    pub group_members: Vec<GroupMember>,
    pub threads: Vec<ThreadItem>,
    pub messages: Vec<Message>,
    pub wiki_articles: Vec<WikiArticle>,
    pub feed_items: Vec<FeedItem>,
    pub knowledge_nodes: Vec<KnowledgeNode>,
    pub knowledge_edges: Vec<KnowledgeEdge>,
    pub agent_feed_items: Vec<AgentFeedItem>,
    pub agent_feedback: Vec<AgentFeedback>,
    pub matrix_user_links: Vec<MatrixUserLink>,
    pub matrix_room_links: Vec<MatrixRoomLink>,
    pub matrix_event_links: Vec<MatrixEventLink>,
    next_sequence: usize,
}

impl MockStore {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        users: Vec<UserRef>,
        groups: Vec<Group>,
        group_members: Vec<GroupMember>,
        threads: Vec<ThreadItem>,
        messages: Vec<Message>,
        wiki_articles: Vec<WikiArticle>,
        feed_items: Vec<FeedItem>,
        knowledge_nodes: Vec<KnowledgeNode>,
        knowledge_edges: Vec<KnowledgeEdge>,
        agent_feed_items: Vec<AgentFeedItem>,
        agent_feedback: Vec<AgentFeedback>,
        matrix_user_links: Vec<MatrixUserLink>,
        matrix_room_links: Vec<MatrixRoomLink>,
        matrix_event_links: Vec<MatrixEventLink>,
    ) -> Self {
        Self {
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
            next_sequence: 100,
        }
    }

    pub fn next_id(&mut self, prefix: &str) -> String {
        self.next_sequence += 1;
        format!("{prefix}-{}", self.next_sequence)
    }

    pub fn feedback_counts(&self, agent_feed_item_id: &str) -> AgentFeedbackCounts {
        AgentFeedbackCounts {
            up: self
                .agent_feedback
                .iter()
                .filter(|feedback| {
                    feedback.agent_feed_item_id == agent_feed_item_id && feedback.value > 0
                })
                .count(),
            down: self
                .agent_feedback
                .iter()
                .filter(|feedback| {
                    feedback.agent_feed_item_id == agent_feed_item_id && feedback.value < 0
                })
                .count(),
        }
    }

    pub fn primary_matrix_room_id(&self, group_id: &str) -> Option<String> {
        self.matrix_room_links
            .iter()
            .find(|room| room.group_id == group_id && room.is_primary)
            .map(|room| room.matrix_room_id.clone())
    }

    pub fn groups_with_primary_matrix_rooms(&self) -> Vec<Group> {
        self.groups
            .iter()
            .cloned()
            .map(|mut group| {
                group.matrix_room_id = self.primary_matrix_room_id(&group.id);
                group
            })
            .collect()
    }

    pub fn agent_summary(&self, item: &AgentFeedItem) -> AgentFeedSummary {
        AgentFeedSummary {
            id: item.id.clone(),
            group_id: item.group_id.clone(),
            item_type: item.item_type.clone(),
            title: item.title.clone(),
            priority: item.priority.clone(),
            status: item.status.clone(),
            feedback: self.feedback_counts(&item.id),
        }
    }
}

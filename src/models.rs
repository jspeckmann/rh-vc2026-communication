use serde::{Deserialize, Serialize};
use serde_json::Value;
use utoipa::ToSchema;

#[derive(Serialize, ToSchema)]
pub struct HealthResponse {
    pub status: String,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ChatIndexResponse {
    pub module: String,
    pub frontend_route: String,
    pub api_base_path: String,
    pub local_dev_alias: String,
    pub docs: String,
}

#[derive(Serialize, ToSchema)]
pub struct ErrorResponse {
    pub error: ErrorBody,
}

#[derive(Serialize, ToSchema)]
pub struct ErrorBody {
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub field: Option<String>,
}

#[derive(Clone, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UserRef {
    pub id: String,
    pub display_name: String,
    pub role: String,
    pub source: String,
}

impl UserRef {
    pub fn dummy(id: &str, display_name: &str, role: &str) -> Self {
        Self {
            id: id.to_string(),
            display_name: display_name.to_string(),
            role: role.to_string(),
            source: "dummy".to_string(),
        }
    }
}

#[derive(Serialize, ToSchema)]
pub struct UserListResponse {
    pub users: Vec<UserRef>,
}

#[derive(Clone, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Group {
    pub id: String,
    pub name: String,
    pub description: String,
    pub member_ids: Vec<String>,
    pub matrix_room_id: Option<String>,
    pub created_at: String,
}

#[derive(Serialize, ToSchema)]
pub struct GroupListResponse {
    pub groups: Vec<Group>,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateGroupRequest {
    pub name: String,
    pub description: String,
    pub created_by_user_id: String,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct GroupDetails {
    pub id: String,
    pub name: String,
    pub description: String,
    pub members: Vec<GroupMemberDetail>,
    pub matrix_room: Option<MatrixRoomSummary>,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct GroupMemberDetail {
    pub user_id: String,
    pub display_name: String,
    pub member_role: String,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct MatrixRoomSummary {
    pub matrix_room_id: String,
    pub room_alias: Option<String>,
    pub link_status: String,
}

#[derive(Clone, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct GroupMember {
    pub group_id: String,
    pub user_id: String,
    pub member_role: String,
    pub joined_at: String,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct AddGroupMemberRequest {
    pub user_id: String,
    pub member_role: String,
}

#[derive(Clone, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ThreadItem {
    pub id: String,
    pub group_id: String,
    pub title: String,
    #[serde(rename = "type")]
    pub thread_type: String,
    pub status: String,
    pub created_by: String,
    pub created_at: String,
}

#[derive(Serialize, ToSchema)]
pub struct ThreadListResponse {
    pub threads: Vec<ThreadItem>,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateThreadRequest {
    pub group_id: String,
    pub title: String,
    #[serde(rename = "type")]
    pub thread_type: String,
    pub created_by: String,
}

#[derive(Clone, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Message {
    pub id: String,
    pub thread_id: String,
    pub matrix_room_id: Option<String>,
    pub matrix_event_id: Option<String>,
    pub author_id: String,
    pub body: String,
    pub priority_label: String,
    pub priority_score: f32,
    pub created_at: String,
}

#[derive(Serialize, ToSchema)]
pub struct MessageListResponse {
    pub messages: Vec<Message>,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateMessageRequest {
    pub author_id: String,
    pub body: String,
}

#[derive(Clone, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct WikiArticle {
    pub id: String,
    pub group_id: String,
    pub title: String,
    pub body: String,
    pub tags: Vec<String>,
    pub author_id: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Clone, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct WikiArticleSummary {
    pub id: String,
    pub group_id: String,
    pub title: String,
    pub tags: Vec<String>,
    pub author_id: String,
    pub updated_at: String,
}

impl From<WikiArticle> for WikiArticleSummary {
    fn from(article: WikiArticle) -> Self {
        Self {
            id: article.id,
            group_id: article.group_id,
            title: article.title,
            tags: article.tags,
            author_id: article.author_id,
            updated_at: article.updated_at,
        }
    }
}

#[derive(Serialize, ToSchema)]
pub struct WikiListResponse {
    pub articles: Vec<WikiArticleSummary>,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateWikiArticleRequest {
    pub group_id: String,
    pub title: String,
    pub body: String,
    pub tags: Vec<String>,
    pub author_id: String,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdateWikiArticleRequest {
    pub title: String,
    pub body: String,
    pub tags: Vec<String>,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdateWikiArticleResponse {
    pub id: String,
    pub title: String,
    pub tags: Vec<String>,
    pub updated_at: String,
}

#[derive(Clone, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct FeedItem {
    pub id: String,
    pub group_id: String,
    pub source_type: String,
    pub source_id: String,
    pub title: String,
    pub summary: String,
    pub priority: String,
    pub created_at: String,
}

#[derive(Serialize, ToSchema)]
pub struct FeedListResponse {
    pub items: Vec<FeedItem>,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct FeedRebuildRequest {
    pub group_id: String,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct FeedRebuildResponse {
    pub status: String,
    pub group_id: String,
}

#[derive(Clone, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct KnowledgeNode {
    pub id: String,
    #[serde(rename = "type")]
    pub node_type: String,
    pub title: String,
    pub summary: String,
    pub source_type: String,
    pub source_id: String,
}

#[derive(Clone, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct KnowledgeEdge {
    pub id: String,
    pub from_node_id: String,
    pub to_node_id: String,
    pub relation: String,
    pub confidence: f32,
    pub source_type: String,
    pub source_id: String,
}

#[derive(Serialize, ToSchema)]
pub struct KnowledgeNodeListResponse {
    pub nodes: Vec<KnowledgeNode>,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateKnowledgeNodeRequest {
    #[serde(rename = "type")]
    pub node_type: String,
    pub title: String,
    pub summary: String,
    pub source_type: String,
    pub source_id: String,
}

#[derive(Serialize, ToSchema)]
pub struct KnowledgeEdgeListResponse {
    pub edges: Vec<KnowledgeEdge>,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateKnowledgeEdgeRequest {
    pub from_node_id: String,
    pub to_node_id: String,
    pub relation: String,
    pub confidence: f32,
    pub source_type: String,
    pub source_id: String,
}

#[derive(Serialize, ToSchema)]
pub struct KnowledgeGraphResponse {
    pub nodes: Vec<KnowledgeNode>,
    pub edges: Vec<KnowledgeEdge>,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct AgentAnalyzeRequest {
    pub group_id: String,
    pub source_type: String,
    pub source_id: String,
    pub mode: Option<String>,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct AgentAnalyzeResponse {
    pub created_items: Vec<AgentFeedItem>,
}

#[derive(Clone, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct AgentFeedItem {
    pub id: String,
    pub group_id: String,
    pub item_type: String,
    pub title: String,
    pub content: Value,
    pub source_type: String,
    pub source_id: String,
    pub priority: String,
    pub confidence: f32,
    pub status: String,
    pub created_at: String,
}

#[derive(Clone, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct AgentFeedSummary {
    pub id: String,
    pub group_id: String,
    pub item_type: String,
    pub title: String,
    pub priority: String,
    pub status: String,
    pub feedback: AgentFeedbackCounts,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct AgentFeedItemDetails {
    pub id: String,
    pub group_id: String,
    pub item_type: String,
    pub title: String,
    pub content: Value,
    pub source_type: String,
    pub source_id: String,
    pub priority: String,
    pub confidence: f32,
    pub status: String,
    pub created_at: String,
    pub feedback: AgentFeedbackCounts,
}

#[derive(Serialize, ToSchema)]
pub struct AgentFeedListResponse {
    pub items: Vec<AgentFeedSummary>,
}

#[derive(Clone, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct AgentFeedbackCounts {
    pub up: usize,
    pub down: usize,
}

#[derive(Clone, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct AgentFeedback {
    pub id: String,
    pub agent_feed_item_id: String,
    pub user_id: String,
    pub value: i16,
    pub reason: Option<String>,
    pub created_at: String,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateAgentFeedbackRequest {
    pub user_id: String,
    pub value: i16,
    pub reason: Option<String>,
}

#[derive(Clone, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct MatrixUserLink {
    pub id: String,
    pub user_id: String,
    pub matrix_user_id: String,
    pub link_status: String,
    pub linked_at: String,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct MatrixUserLinkRequest {
    pub user_id: String,
    pub matrix_user_id: String,
}

#[derive(Clone, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct MatrixRoomLink {
    pub id: String,
    pub group_id: String,
    pub matrix_room_id: String,
    pub room_alias: Option<String>,
    pub is_primary: bool,
    pub link_status: String,
    pub created_at: String,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct MatrixRoomLinkRequest {
    pub group_id: String,
    pub matrix_room_id: String,
    pub room_alias: Option<String>,
    pub is_primary: bool,
}

#[derive(Serialize, ToSchema)]
pub struct MatrixRoomListResponse {
    pub rooms: Vec<MatrixRoomLink>,
}

#[derive(Serialize, ToSchema)]
pub struct DashboardResponse {
    pub status: DashboardStatus,
    pub groups: Vec<Group>,
    pub feed: Vec<FeedItem>,
    pub wiki: Vec<WikiArticleSummary>,
    #[serde(rename = "agentFeed")]
    pub agent_feed: Vec<AgentFeedSummary>,
    #[serde(rename = "knowledgeGraph")]
    pub knowledge_graph: DashboardKnowledgeGraph,
}

#[derive(Serialize, ToSchema)]
pub struct DashboardStatus {
    pub api: String,
    pub database: String,
    pub matrix: String,
    pub llm: String,
    #[serde(rename = "userAdapter")]
    pub user_adapter: String,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct DashboardKnowledgeGraph {
    pub node_count: usize,
    pub edge_count: usize,
}

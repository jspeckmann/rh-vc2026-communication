import {
  Activity,
  Bot,
  Check,
  ChevronRight,
  Database,
  FileText,
  GitBranch,
  LayoutDashboard,
  MessageSquareText,
  Network,
  Plus,
  Send,
  ThumbsDown,
  ThumbsUp,
  Users,
} from "lucide-react";
import {
  EmptyState,
  formatKind,
  formatTime,
  IconToggle,
  Panel,
  StatusBadge,
  Tag,
  TextButton,
} from "./common.jsx";

const navIcons = {
  dashboard: LayoutDashboard,
  groups: Users,
  chat: MessageSquareText,
  wiki: FileText,
  graph: Network,
  agent: Bot,
};

export function AppShell({
  activeView,
  onViewChange,
  children,
  detail,
  status,
  index,
  theme,
  onThemeToggle,
  selectedUserId,
  users,
  onUserChange,
}) {
  const navItems = [
    ["dashboard", "Dashboard"],
    ["groups", "Gruppen"],
    ["chat", "Matrix Chat"],
    ["wiki", "Wiki"],
    ["graph", "Graph"],
    ["agent", "Agent"],
  ];

  return (
    <div className="app-shell">
      <aside className="side-nav">
        <div className="brand">
          <div className="brand__mark">K</div>
          <div>
            <strong>{index?.module ?? "Kommunikation"}</strong>
            <span>/chat</span>
          </div>
        </div>
        <nav className="side-nav__links" aria-label="Modulnavigation">
          {navItems.map(([id, label]) => {
            const Icon = navIcons[id];
            return (
              <button
                key={id}
                className={activeView === id ? "is-active" : ""}
                type="button"
                onClick={() => onViewChange(id)}
              >
                <Icon aria-hidden="true" size={18} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="workspace">
        <header className="top-bar">
          <div>
            <p className="route-label">{index?.apiBasePath ?? "/api/chat"}</p>
            <h1>Team 1 Kommunikation</h1>
          </div>
          <div className="top-bar__controls">
            <select
              aria-label="Aktiver Dummy-User"
              className="select-control"
              value={selectedUserId}
              onChange={(event) => onUserChange(event.target.value)}
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.displayName}
                </option>
              ))}
            </select>
            <IconToggle theme={theme} onToggle={onThemeToggle} />
          </div>
        </header>

        <div className="status-strip">
          <StatusBadge label="API" value={status.api ?? "offen"} tone="success" />
          <StatusBadge
            label="DB"
            value={status.database ?? "mock"}
            tone={status.database === "postgres" ? "success" : "progress"}
          />
          <StatusBadge label="Matrix" value={status.matrix ?? "offen"} tone="success" />
          <StatusBadge label="LLM" value={status.llm ?? "mock"} tone="progress" />
          <StatusBadge label="User" value={status.userAdapter ?? "dummy"} tone="progress" />
        </div>

        <main className="content-grid">
          <div className="primary-content">{children}</div>
          <aside className="detail-rail">{detail}</aside>
        </main>
      </div>
    </div>
  );
}

export function DashboardView({ dashboard, users, groups, onOpenView }) {
  const statusCards = [
    ["Gruppen", dashboard.groups?.length ?? groups.length, Users],
    ["Feed", dashboard.feed?.length ?? 0, Activity],
    ["Wiki", dashboard.wiki?.length ?? 0, FileText],
    ["Graph", dashboard.knowledgeGraph?.nodeCount ?? 0, GitBranch],
  ];

  return (
    <div className="view-stack">
      <section className="metric-grid">
        {statusCards.map(([label, value, Icon]) => (
          <button key={label} className="metric-card" type="button" onClick={() => onOpenView(label.toLowerCase() === "graph" ? "graph" : label.toLowerCase())}>
            <Icon aria-hidden="true" size={22} />
            <span>{label}</span>
            <strong>{value}</strong>
          </button>
        ))}
      </section>

      <div className="two-column">
        <Panel title="Aktuelle Gruppen">
          <div className="list-stack">
            {(dashboard.groups ?? groups).map((group) => (
              <article className="row-item" key={group.id}>
                <div>
                  <strong>{group.name}</strong>
                  <span>{group.description}</span>
                </div>
                <Tag tone="progress">{group.memberIds?.length ?? 0} Mitglieder</Tag>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Feed">
          <div className="list-stack">
            {(dashboard.feed ?? []).map((item) => (
              <article className="row-item" key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.summary}</span>
                </div>
                <Tag tone={item.priority === "high" ? "danger" : "neutral"}>{item.priority}</Tag>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Agent und Wissen">
        <div className="wide-summary">
          <div>
            <span>Agent-Items</span>
            <strong>{dashboard.agentFeed?.length ?? 0}</strong>
          </div>
          <div>
            <span>Graph-Knoten</span>
            <strong>{dashboard.knowledgeGraph?.nodeCount ?? 0}</strong>
          </div>
          <div>
            <span>Graph-Kanten</span>
            <strong>{dashboard.knowledgeGraph?.edgeCount ?? 0}</strong>
          </div>
          <div>
            <span>Dummy-User</span>
            <strong>{users.length}</strong>
          </div>
        </div>
      </Panel>
    </div>
  );
}

export function GroupsView({
  groups,
  selectedGroupId,
  onSelectGroup,
  groupDetails,
  matrixRooms,
}) {
  const selectedRooms = matrixRooms.filter((room) => room.groupId === selectedGroupId);

  return (
    <div className="split-view">
      <Panel title="Gruppen">
        <div className="list-stack">
          {groups.map((group) => (
            <button
              key={group.id}
              className={`select-row ${group.id === selectedGroupId ? "is-active" : ""}`}
              type="button"
              onClick={() => onSelectGroup(group.id)}
            >
              <div>
                <strong>{group.name}</strong>
                <span>{group.description}</span>
              </div>
              <ChevronRight aria-hidden="true" size={17} />
            </button>
          ))}
        </div>
      </Panel>

      <Panel title={groupDetails?.name ?? "Details"}>
        {groupDetails ? (
          <div className="detail-stack">
            <p className="body-copy">{groupDetails.description}</p>
            <div className="chip-row">
              {selectedRooms.map((room) => (
                <Tag key={room.id} tone="success">
                  {room.roomAlias ?? room.matrixRoomId}
                </Tag>
              ))}
              {!selectedRooms.length ? <Tag tone="progress">Matrix offen</Tag> : null}
            </div>
            <div className="member-grid">
              {groupDetails.members.map((member) => (
                <article key={member.userId} className="member-card">
                  <span>{member.displayName}</span>
                  <strong>{member.memberRole}</strong>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState title="Keine Gruppe gewaehlt" />
        )}
      </Panel>
    </div>
  );
}

export function ChatView({
  groups,
  threads,
  messages,
  selectedGroupId,
  selectedThreadId,
  selectedUserId,
  usersById,
  messageDraft,
  threadDraft,
  onGroupChange,
  onThreadChange,
  onMessageDraftChange,
  onThreadDraftChange,
  onSendMessage,
  onCreateThread,
  isSending,
}) {
  const groupThreads = threads.filter((thread) => thread.groupId === selectedGroupId);

  return (
    <div className="chat-layout">
      <Panel title="Raeume">
        <div className="segmented-list">
          {groups.map((group) => (
            <button
              key={group.id}
              className={group.id === selectedGroupId ? "is-active" : ""}
              type="button"
              onClick={() => onGroupChange(group.id)}
            >
              {group.name}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Threads">
        <div className="list-stack">
          {groupThreads.map((thread) => (
            <button
              key={thread.id}
              className={`select-row ${thread.id === selectedThreadId ? "is-active" : ""}`}
              type="button"
              onClick={() => onThreadChange(thread.id)}
            >
              <div>
                <strong>{thread.title}</strong>
                <span>{formatKind(thread.type)} · {thread.status}</span>
              </div>
              <ChevronRight aria-hidden="true" size={17} />
            </button>
          ))}
        </div>
        <form className="inline-form" onSubmit={onCreateThread}>
          <input
            className="input-field compact-input"
            value={threadDraft.title}
            onChange={(event) => onThreadDraftChange({ ...threadDraft, title: event.target.value })}
            placeholder="Neuer Thread"
          />
          <select
            className="select-control"
            value={threadDraft.type}
            onChange={(event) => onThreadDraftChange({ ...threadDraft, type: event.target.value })}
          >
            <option value="discussion">Diskussion</option>
            <option value="question">Frage</option>
            <option value="decision">Entscheidung</option>
          </select>
          <TextButton icon={Plus} variant="secondary" disabled={!threadDraft.title.trim()}>
            Anlegen
          </TextButton>
        </form>
      </Panel>

      <Panel title="Matrix Chat" className="chat-panel">
        <div className="message-list" aria-live="polite">
          {messages.length ? (
            messages.map((message) => (
              <article
                key={message.id}
                className={`message-bubble ${message.authorId === selectedUserId ? "is-own" : ""}`}
              >
                <header>
                  <strong>{usersById.get(message.authorId)?.displayName ?? message.authorId}</strong>
                  <span>{formatTime(message.createdAt)}</span>
                </header>
                <p>{message.body}</p>
                <Tag tone={message.priorityLabel === "high" ? "danger" : "neutral"}>
                  {message.priorityLabel}
                </Tag>
              </article>
            ))
          ) : (
            <EmptyState title="Keine Nachrichten" text="Seed-Daten oder neue Nachricht erscheinen hier." />
          )}
        </div>
        <form className="composer" onSubmit={onSendMessage}>
          <input
            className="input-field compact-input"
            value={messageDraft}
            onChange={(event) => onMessageDraftChange(event.target.value)}
            placeholder="Nachricht schreiben"
            disabled={!selectedThreadId}
          />
          <TextButton
            icon={Send}
            disabled={!messageDraft.trim() || !selectedThreadId || isSending}
          >
            Senden
          </TextButton>
        </form>
      </Panel>
    </div>
  );
}

export function WikiView({ articles, selectedArticleId, articleDetails, onSelectArticle }) {
  return (
    <div className="split-view">
      <Panel title="Knowledge Base">
        <div className="list-stack">
          {articles.map((article) => (
            <button
              key={article.id}
              className={`select-row ${article.id === selectedArticleId ? "is-active" : ""}`}
              type="button"
              onClick={() => onSelectArticle(article.id)}
            >
              <div>
                <strong>{article.title}</strong>
                <span>{article.tags?.join(", ")}</span>
              </div>
              <ChevronRight aria-hidden="true" size={17} />
            </button>
          ))}
        </div>
      </Panel>
      <Panel title={articleDetails?.title ?? "Artikel"}>
        {articleDetails ? (
          <div className="detail-stack">
            <div className="chip-row">
              {articleDetails.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
            <p className="body-copy">{articleDetails.body}</p>
            <div className="meta-line">
              <FileText aria-hidden="true" size={16} />
              <span>{articleDetails.status}</span>
              <span>{formatTime(articleDetails.updatedAt)}</span>
            </div>
          </div>
        ) : (
          <EmptyState title="Kein Artikel gewaehlt" />
        )}
      </Panel>
    </div>
  );
}

export function KnowledgeGraphView({ graph }) {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));

  return (
    <div className="view-stack">
      <Panel title="Knowledge Graph">
        <div className="graph-canvas">
          {graph.nodes.map((node, index) => (
            <article key={node.id} className={`graph-node graph-node--${index % 5}`}>
              <span>{formatKind(node.type)}</span>
              <strong>{node.title}</strong>
            </article>
          ))}
        </div>
      </Panel>
      <Panel title="Beziehungen">
        <div className="relation-list">
          {graph.edges.map((edge) => (
            <article key={edge.id} className="relation-item">
              <span>{nodesById.get(edge.fromNodeId)?.title ?? edge.fromNodeId}</span>
              <Tag tone="progress">{edge.relation}</Tag>
              <span>{nodesById.get(edge.toNodeId)?.title ?? edge.toNodeId}</span>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export function AgentView({
  items,
  selectedAgentId,
  selectedAgent,
  onSelectAgent,
  onAnalyze,
  onFeedback,
  isWorking,
}) {
  return (
    <div className="split-view">
      <Panel
        title="Agent Feed"
        action={
          <TextButton icon={Bot} variant="secondary" onClick={onAnalyze} disabled={isWorking}>
            Analyse
          </TextButton>
        }
      >
        <div className="list-stack">
          {items.map((item) => (
            <button
              key={item.id}
              className={`select-row ${item.id === selectedAgentId ? "is-active" : ""}`}
              type="button"
              onClick={() => onSelectAgent(item.id)}
            >
              <div>
                <strong>{item.title}</strong>
                <span>{formatKind(item.itemType)} · {item.status}</span>
              </div>
              <Tag tone={item.priority === "high" ? "danger" : "neutral"}>{item.priority}</Tag>
            </button>
          ))}
        </div>
      </Panel>
      <Panel title={selectedAgent?.title ?? "Agent Item"}>
        {selectedAgent ? (
          <div className="detail-stack">
            <div className="chip-row">
              <Tag tone="progress">{formatKind(selectedAgent.itemType)}</Tag>
              <Tag>{Math.round((selectedAgent.confidence ?? 0) * 100)}%</Tag>
            </div>
            <AgentContent content={selectedAgent.content} />
            <div className="feedback-row">
              <TextButton icon={ThumbsUp} variant="secondary" onClick={() => onFeedback(1)}>
                Hilft
              </TextButton>
              <TextButton icon={ThumbsDown} variant="secondary" onClick={() => onFeedback(-1)}>
                Passt nicht
              </TextButton>
              <span>
                <Check aria-hidden="true" size={15} />
                {selectedAgent.feedback?.up ?? 0} / {selectedAgent.feedback?.down ?? 0}
              </span>
            </div>
          </div>
        ) : (
          <EmptyState title="Kein Agent-Item gewaehlt" />
        )}
      </Panel>
    </div>
  );
}

function AgentContent({ content }) {
  if (Array.isArray(content?.tasks)) {
    return (
      <ul className="task-list">
        {content.tasks.map((task) => (
          <li key={task}>{task}</li>
        ))}
      </ul>
    );
  }
  if (content?.summary) {
    return <p className="body-copy">{content.summary}</p>;
  }
  if (content?.reason) {
    return <p className="body-copy">{content.reason}</p>;
  }
  return <pre className="json-block">{JSON.stringify(content, null, 2)}</pre>;
}

export function DetailRail({
  selectedGroup,
  selectedThread,
  selectedArticle,
  selectedAgent,
  matrixRooms,
}) {
  const groupRooms = selectedGroup
    ? matrixRooms.filter((room) => room.groupId === selectedGroup.id)
    : [];

  return (
    <div className="rail-stack">
      <Panel title="Kontext">
        <div className="detail-stack">
          {selectedGroup ? (
            <>
              <strong>{selectedGroup.name}</strong>
              <span>{selectedGroup.description}</span>
              {groupRooms.map((room) => (
                <Tag key={room.id} tone="success">
                  {room.roomAlias ?? room.matrixRoomId}
                </Tag>
              ))}
            </>
          ) : (
            <EmptyState title="Keine Gruppe" />
          )}
        </div>
      </Panel>

      <Panel title="Aktive Auswahl">
        <div className="rail-facts">
          <span>Thread</span>
          <strong>{selectedThread?.title ?? "offen"}</strong>
          <span>Wiki</span>
          <strong>{selectedArticle?.title ?? "offen"}</strong>
          <span>Agent</span>
          <strong>{selectedAgent?.status ?? "offen"}</strong>
        </div>
      </Panel>
    </div>
  );
}

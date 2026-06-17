const API_BASE = "/api/chat";

export class ChatApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "ChatApiError";
    this.status = status;
    this.body = body;
  }
}

async function apiJson(path = "", options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = body?.error?.message ?? `HTTP ${response.status}`;
    throw new ChatApiError(message, response.status, body);
  }

  return body;
}

function query(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });
  const value = searchParams.toString();
  return value ? `?${value}` : "";
}

export async function fetchBootstrap() {
  const [
    index,
    dashboard,
    users,
    groups,
    threads,
    wiki,
    graph,
    agentFeed,
    matrixRooms,
  ] = await Promise.all([
    apiJson(""),
    apiJson("/dashboard"),
    apiJson("/users"),
    apiJson("/groups"),
    apiJson("/threads"),
    apiJson("/wiki"),
    apiJson("/knowledge/graph"),
    apiJson("/agent/feed"),
    apiJson("/matrix/rooms"),
  ]);

  return {
    index,
    dashboard,
    users: users.users ?? [],
    groups: groups.groups ?? [],
    threads: threads.threads ?? [],
    wiki: wiki.articles ?? [],
    graph: {
      nodes: graph.nodes ?? [],
      edges: graph.edges ?? [],
    },
    agentFeed: agentFeed.items ?? [],
    matrixRooms: matrixRooms.rooms ?? [],
  };
}

export function fetchGroupDetails(groupId) {
  return apiJson(`/groups/${encodeURIComponent(groupId)}`);
}

export function fetchThreads(groupId) {
  return apiJson(`/threads${query({ groupId })}`).then((body) => body.threads ?? []);
}

export function createThread(payload) {
  return apiJson("/threads", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchMessages(threadId) {
  return apiJson(`/threads/${encodeURIComponent(threadId)}/messages`).then(
    (body) => body.messages ?? [],
  );
}

export function createMessage(threadId, payload) {
  return apiJson(`/threads/${encodeURIComponent(threadId)}/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchWikiArticle(articleId) {
  return apiJson(`/wiki/${encodeURIComponent(articleId)}`);
}

export function fetchAgentItem(itemId) {
  return apiJson(`/agent/feed/${encodeURIComponent(itemId)}`);
}

export function analyzeAgent(payload) {
  return apiJson("/agent/analyze", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createAgentFeedback(itemId, payload) {
  return apiJson(`/agent/feed/${encodeURIComponent(itemId)}/feedback`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

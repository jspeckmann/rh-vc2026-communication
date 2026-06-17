const BASE_URL = '/api/chat';
export const DEFAULT_GROUP_ID = 'group-team-1';
export const DEFAULT_USER_ID = 'user-david';

export function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function mapAgentFeedItem(item) {
  return {
    id: item.id,
    groupId: item.groupId,
    itemType: item.itemType,
    title: item.title,
    description: `${item.itemType ?? 'Analyse'} / ${item.priority ?? 'normal'} / ${item.status ?? 'offen'}`,
    priority: item.priority ?? 'normal',
    status: item.status ?? 'offen',
    feedback: item.feedback ?? { up: 0, down: 0 },
    time: item.createdAt ? formatTime(item.createdAt) : '',
  };
}

function query(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });
  const value = searchParams.toString();
  return value ? `?${value}` : '';
}

export async function fetchWithAuth(endpoint, options = {}) {
  const token = window.localStorage.getItem('authToken');

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = { ...options, headers };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    throw new Error('Received HTML response - backend not available');
  }
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  if (response.status === 204) return null;
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

export async function fetchDashboard() {
  return fetchWithAuth('/dashboard');
}

export async function fetchUsers() {
  const data = await fetchWithAuth('/users');
  return data.users ?? [];
}

export async function fetchGroups() {
  const data = await fetchWithAuth('/groups');
  return data.groups ?? [];
}

export function createGroup(payload) {
  return fetchWithAuth('/groups', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchGroupDetails(groupId) {
  return fetchWithAuth(`/groups/${encodeURIComponent(groupId)}`);
}

export async function fetchMatrixRooms(groupId) {
  const data = await fetchWithAuth(`/matrix/rooms${query({ groupId })}`);
  return data.rooms ?? [];
}

export async function fetchThreads(groupId = DEFAULT_GROUP_ID) {
  const data = await fetchWithAuth(`/threads${query({ groupId })}`);
  return data.threads ?? [];
}

export function createThread(payload) {
  return fetchWithAuth('/threads', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchMessages(threadId) {
  if (!threadId) return [];
  const data = await fetchWithAuth(`/threads/${encodeURIComponent(threadId)}/messages`);
  return data.messages ?? [];
}

export function sendMessage(threadId, text, authorId = DEFAULT_USER_ID) {
  return fetchWithAuth(`/threads/${encodeURIComponent(threadId)}/messages`, {
    method: 'POST',
    body: JSON.stringify({ authorId, body: text }),
  });
}

export async function fetchWikiArticles(groupId = DEFAULT_GROUP_ID) {
  const data = await fetchWithAuth(`/wiki${query({ groupId })}`);
  return data.articles ?? [];
}

export function fetchWikiArticle(articleId) {
  return fetchWithAuth(`/wiki/${encodeURIComponent(articleId)}`);
}

export async function fetchAIFeed(groupId = DEFAULT_GROUP_ID) {
  const data = await fetchWithAuth(`/agent/feed${query({ groupId })}`);
  return (data.items ?? []).map(mapAgentFeedItem);
}

export function fetchAgentItem(itemId) {
  return fetchWithAuth(`/agent/feed/${encodeURIComponent(itemId)}`);
}

export function analyzeAgent(payload) {
  return fetchWithAuth('/agent/analyze', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createAgentFeedback(itemId, payload) {
  return fetchWithAuth(`/agent/feed/${encodeURIComponent(itemId)}/feedback`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchNetworkData() {
  const data = await fetchWithAuth('/knowledge/graph');
  return {
    nodes: (data.nodes ?? []).map((node) => ({
      id: node.id,
      type: node.type,
      title: node.title,
      summary: node.summary,
      sourceType: node.sourceType,
      sourceId: node.sourceId,
      group: node.type,
    })),
    links: (data.edges ?? []).map((edge) => ({
      id: edge.id,
      source: edge.fromNodeId,
      target: edge.toNodeId,
      relation: edge.relation,
      confidence: edge.confidence,
      sourceType: edge.sourceType,
      sourceId: edge.sourceId,
    })),
  };
}

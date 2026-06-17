import { fallbackFeedItems, getMockNetworkData } from '../data/mocks.js';

const BASE_URL = '/api/chat';

function formatTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function mapAgentFeedItem(item) {
  return {
    id: item.id,
    title: item.title,
    description: `${item.itemType ?? 'Analyse'} · ${item.priority ?? 'normal'} · ${item.status ?? 'offen'}`,
    time: item.createdAt ? formatTime(item.createdAt) : '',
  };
}

async function getDefaultThreadId() {
  const data = await fetchWithAuth('/threads?groupId=group-team-1');
  return data.threads?.[0]?.id ?? 'thread-matrix-link';
}

export async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem('authToken');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = { ...options, headers };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    throw new Error('Received HTML response — backend not available');
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

export async function fetchAIFeed() {
  try {
    const data = await fetchWithAuth('/agent/feed?groupId=group-team-1');
    return (data.items ?? []).map(mapAgentFeedItem);
  } catch {
    return fallbackFeedItems;
  }
}

export async function fetchWikiContent() {
  try {
    const data = await fetchWithAuth('/wiki?groupId=group-team-1');
    const articles = data.articles ?? [];
    if (articles.length === 0) return 'Wiki ist noch leer.';
    return articles
      .map((article) => {
        const tags = article.tags?.length ? `\nTags: ${article.tags.join(', ')}` : '';
        return `# ${article.title}${tags}\nAktualisiert: ${formatTime(article.updatedAt)}`;
      })
      .join('\n\n');
  } catch {
    return 'Wiki-Inhalte sind noch nicht angebunden.';
  }
}

export async function fetchNetworkData() {
  try {
    const data = await fetchWithAuth('/knowledge/graph');
    return {
      nodes: (data.nodes ?? []).map((node) => ({
        id: node.id,
        title: node.title,
        summary: node.summary,
        group: node.type,
      })),
      links: (data.edges ?? []).map((edge) => ({
        source: edge.fromNodeId,
        target: edge.toNodeId,
        relation: edge.relation,
        confidence: edge.confidence,
      })),
    };
  } catch {
    return getMockNetworkData();
  }
}

export async function sendMessage(text) {
  try {
    const threadId = await getDefaultThreadId();
    return await fetchWithAuth(`/threads/${encodeURIComponent(threadId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ authorId: 'user-david', body: text }),
    });
  } catch (e) {
    throw new Error('Send failed', { cause: e });
  }
}

export async function fetchMessages() {
  try {
    const threadId = await getDefaultThreadId();
    const data = await fetchWithAuth(`/threads/${encodeURIComponent(threadId)}/messages`);
    return (data.messages ?? []).map((message) => ({
      id: message.id,
      text: message.body,
      status: message.priorityLabel,
      timestamp: message.createdAt,
    }));
  } catch {
    return [];
  }
}

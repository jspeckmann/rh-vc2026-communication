import { fallbackFeedItems, getMockNetworkData } from '../data/mocks.js';

const BASE_URL = '/chat/api';

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
    return await fetchWithAuth('/ai-feed');
  } catch {
    return fallbackFeedItems;
  }
}

export async function fetchWikiContent() {
  try {
    return await fetchWithAuth('/wiki');
  } catch {
    return 'Wiki-Inhalte sind noch nicht angebunden.';
  }
}

export async function fetchNetworkData() {
  try {
    return await fetchWithAuth('/network');
  } catch {
    return getMockNetworkData();
  }
}

export async function sendMessage(text) {
  try {
    return await fetchWithAuth('/messages', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  } catch (e) {
    throw new Error('Send failed', { cause: e });
  }
}

export async function fetchMessages() {
  try {
    return await fetchWithAuth('/messages');
  } catch {
    return [];
  }
}

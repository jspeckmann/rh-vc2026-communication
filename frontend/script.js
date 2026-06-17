const BASE_URL = '/chat/api';
const AUTH_URL = '/auth';

const fallbackFeedItems = [
  {
    title: 'Neue Projekt-Updates',
    description: 'Es gibt neue Informationen zu Projekt A in der Vernetzungswolke.',
    time: 'Vor 5 Minuten'
  },
  {
    title: 'Relevante Wiki-Änderungen',
    description: 'Das Wiki wurde von Max aktualisiert. Enthält neue Details zu JavaScript-Best Practices.',
    time: 'Vor 12 Minuten'
  },
  {
    title: 'Chat-Nachricht für dich',
    description: 'Lisa hat eine Nachricht in dem Team-Chat hinterlassen, die deine Skills betrifft.',
    time: 'Vor 25 Minuten'
  }
];

function checkOSDarkMode() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function initDarkMode() {
  const savedTheme = localStorage.getItem('theme');
  const osPrefersDark = checkOSDarkMode();

  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else if (osPrefersDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

function toggleDarkMode() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem('authToken');

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...defaultOptions,
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('application/json') ? await response.json() : null;
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

function closeAIFeedPanel() {
  document.getElementById('ai-feed-panel')?.classList.remove('active');
}

function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });

  document.getElementById(sectionId)?.classList.add('active');
  closeAIFeedPanel();
}

function updateBreadcrumb(text) {
  const breadcrumbCurrent = document.getElementById('breadcrumb-current');
  if (breadcrumbCurrent) {
    breadcrumbCurrent.textContent = text;
  }
}

function toggleAIFeedPanel() {
  const aiFeedPanel = document.getElementById('ai-feed-panel');
  if (!aiFeedPanel) return;

  aiFeedPanel.classList.toggle('active');

  if (aiFeedPanel.classList.contains('active')) {
    loadAIFeedData();
  }
}

function renderAIFeedItems(items) {
  const aiFeedContent = document.getElementById('ai-feed-content');
  if (!aiFeedContent) return;

  aiFeedContent.innerHTML = '';

  items.forEach(item => {
    const feedItem = createElement('div', 'ai-feed-item');
    const title = createElement('h4', '', item.title);
    const description = createElement('p', '', item.description);
    const meta = createElement('div', 'meta', item.time);

    feedItem.append(title, description, meta);
    aiFeedContent.appendChild(feedItem);
  });
}

async function loadAIFeedData() {
  const aiFeedContent = document.getElementById('ai-feed-content');
  if (!aiFeedContent) return;

  aiFeedContent.textContent = 'Lade Daten...';

  try {
    const feedItems = await fetchWithAuth('/ai-feed');
    const items = Array.isArray(feedItems?.items)
      ? feedItems.items
      : Array.isArray(feedItems)
        ? feedItems
        : fallbackFeedItems;

    renderAIFeedItems(items);
  } catch (error) {
    console.error('AI Feed konnte nicht geladen werden:', error);
    renderAIFeedItems(fallbackFeedItems);
  }
}

function appendChatMessage(sender, text, status) {
  const chatMessages = document.getElementById('chat-messages');
  if (!chatMessages) return null;

  const message = createElement('p', 'chat-message text-main');
  const senderLabel = createElement('strong', '', `${sender}: `);
  const messageText = createElement('span', '', text);
  const messageStatus = createElement('span', 'message-status', status ? ` (${status})` : '');

  message.append(senderLabel, messageText, messageStatus);
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return { message, messageStatus };
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-btn');
  const message = input?.value.trim();

  if (!message) return;

  const pendingMessage = appendChatMessage('Du', message, 'Sende...');
  input.value = '';

  if (sendButton) {
    sendButton.disabled = true;
  }

  try {
    await fetchWithAuth('/messages', {
      method: 'POST',
      body: JSON.stringify({ text: message })
    });

    if (pendingMessage?.messageStatus) {
      pendingMessage.messageStatus.textContent = ' (Gesendet)';
    }
  } catch (error) {
    console.error('Nachricht konnte nicht gesendet werden:', error);
    if (pendingMessage?.messageStatus) {
      pendingMessage.messageStatus.textContent = ' (Nicht gesendet)';
    }
  } finally {
    if (sendButton) {
      sendButton.disabled = false;
    }
    input?.focus();
  }
}

function createGroupItem(title, items, active = true) {
  const groupItem = createElement('div', 'group-item');
  const header = createElement('div', `group-header${active ? '' : ' collapsed'}`);
  const headerText = createElement('span');
  const icon = createElement('span', 'icon', '📁');
  const label = createElement('span', '', title);
  const chevron = createElement('span', 'chevron', '▼');
  const content = createElement('div', `group-content ${active ? 'active' : ''}`);

  headerText.append(icon, label);
  header.append(headerText, chevron);

  items.forEach(item => {
    const recentItem = createElement('div', 'recent-item');
    const itemIcon = createElement('span', 'icon', item.icon);
    const itemLabel = createElement('span', '', item.label);
    const closeButton = createElement('button', 'close-btn', '×');

    closeButton.type = 'button';
    closeButton.addEventListener('click', event => {
      event.stopPropagation();
      recentItem.remove();
    });

    recentItem.append(itemIcon, itemLabel, closeButton);
    content.appendChild(recentItem);
  });

  header.addEventListener('click', () => {
    header.classList.toggle('collapsed');
    content.classList.toggle('active');
  });

  groupItem.append(header, content);
  return groupItem;
}

function initDefaultGroups() {
  const groupContainer = document.getElementById('group-container');
  if (!groupContainer) return;

  groupContainer.append(
    createGroupItem(
      'Hackathon-Projekte',
      [
        { icon: '💬', label: 'Projekt A Chat' },
        { icon: '📚', label: 'Projekt A Wiki' },
        { icon: '🌐', label: 'Projekt A Vernetzung' }
      ],
      true
    ),
    createGroupItem(
      'Team-Intern',
      [{ icon: '💬', label: 'Team-Chat' }],
      false
    )
  );
}

function getButtonText(button) {
  return button.querySelector('span:not(.icon)')?.textContent.trim() || button.textContent.trim();
}

function getButtonIcon(button) {
  return button.querySelector('.icon')?.textContent || '';
}

function addToRecent(button) {
  const recentSection = document.getElementById('recent-items');
  if (!recentSection) return;

  const icon = getButtonIcon(button);
  const text = getButtonText(button);

  const existingItems = recentSection.querySelectorAll('.recent-item');
  for (const item of existingItems) {
    const itemText = item.querySelector('span:not(.icon)')?.textContent || '';
    if (itemText === text) return;
  }

  const recentItem = createElement('div', 'recent-item');
  const recentIcon = createElement('span', 'icon', icon);
  const recentText = createElement('span', '', text);
  const closeButton = createElement('button', 'close-btn', '×');

  closeButton.type = 'button';
  closeButton.addEventListener('click', event => {
    event.stopPropagation();
    recentItem.remove();
  });

  recentItem.append(recentIcon, recentText, closeButton);

  if (recentSection.firstChild) {
    recentSection.insertBefore(recentItem, recentSection.firstChild);
  } else {
    recentSection.appendChild(recentItem);
  }

  recentItem.addEventListener('click', () => {
    const buttonId = button.id;
    const sectionId = buttonId.replace('-btn', '-section');

    if (buttonId === 'ai-feed-btn') {
      toggleAIFeedPanel();
      return;
    }

    document.querySelectorAll('.left-nav .btn-nav').forEach(btn => {
      if (btn.id !== 'ai-feed-btn') {
        btn.classList.remove('active');
      }
    });
    document.getElementById(buttonId)?.classList.add('active');

    if (sectionId === 'network-section') {
      initNetworkGraph();
    }

    showSection(sectionId);
    updateBreadcrumb(text);
  });
}

function setupNavigation() {
  const mainNavButtons = document.querySelectorAll('.left-nav .btn-nav');
  const subNavButtons = document.querySelectorAll('.sub-nav .btn-subnav');

  mainNavButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (button.id === 'ai-feed-btn') {
        toggleAIFeedPanel();
        return;
      }

      mainNavButtons.forEach(btn => {
        if (btn.id !== 'ai-feed-btn') {
          btn.classList.remove('active');
        }
      });
      button.classList.add('active');

      const sectionId = button.id.replace('-btn', '-section');
      const text = getButtonText(button);

      if (sectionId === 'network-section') {
        initNetworkGraph();
      }

      showSection(sectionId);
      updateBreadcrumb(text);
      addToRecent(button);
    });
  });

  subNavButtons.forEach(button => {
    button.addEventListener('click', () => {
      subNavButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
    });
  });
}

function addNewGroup(name) {
  const groupContainer = document.getElementById('group-container');
  if (!groupContainer) return;

  const groupItem = createElement('div', 'group-item');
  const header = createElement('div', 'group-header');
  const headerText = createElement('span');
  const icon = createElement('span', 'icon', '📁');
  const label = createElement('span', '', name);
  const chevron = createElement('span', 'chevron', '▼');
  const content = createElement('div', 'group-content active');

  headerText.append(icon, label);
  header.append(headerText, chevron);
  groupItem.append(header, content);

  header.addEventListener('click', () => {
    header.classList.toggle('collapsed');
    content.classList.toggle('active');
  });

  groupContainer.appendChild(groupItem);
}

function setupModal() {
  const addGroupBtn = document.getElementById('add-group-btn');
  const modal = document.getElementById('add-group-modal');
  const modalClose = document.getElementById('modal-close');
  const modalCancel = document.getElementById('modal-cancel');
  const modalConfirm = document.getElementById('modal-confirm');
  const groupNameInput = document.getElementById('group-name-input');

  addGroupBtn?.addEventListener('click', () => {
    modal?.classList.add('active');
    if (groupNameInput) {
      groupNameInput.value = '';
      groupNameInput.focus();
    }
  });

  modalClose?.addEventListener('click', () => {
    modal?.classList.remove('active');
  });

  modalCancel?.addEventListener('click', () => {
    modal?.classList.remove('active');
  });

  modalConfirm?.addEventListener('click', () => {
    const groupName = groupNameInput?.value.trim();
    if (groupName && modal) {
      addNewGroup(groupName);
      modal.classList.remove('active');
    }
  });

  groupNameInput?.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      modalConfirm?.click();
    }
  });

  modal?.addEventListener('click', event => {
    if (event.target === modal) {
      modal.classList.remove('active');
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      modal?.classList.remove('active');
      closeAIFeedPanel();
    }
  });
}

async function loadWikiContent() {
  const wikiContent = document.getElementById('wiki-content');
  if (!wikiContent) return;

  wikiContent.textContent = 'Lade Wiki-Inhalte...';

  try {
    const content = await fetchWithAuth('/wiki');
    const text = typeof content === 'string'
      ? content
      : content
        ? JSON.stringify(content, null, 2)
        : 'Wiki ist noch leer.';

    wikiContent.textContent = text;
  } catch (error) {
    console.error('Wiki-Inhalte konnten nicht geladen werden:', error);
    wikiContent.textContent = 'Wiki-Inhalte sind noch nicht angebunden.';
  }
}

document.getElementById('dark-mode-toggle')?.addEventListener('click', toggleDarkMode);

window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', event => {
  if (!localStorage.getItem('theme')) {
    document.documentElement.setAttribute('data-theme', event.matches ? 'dark' : 'light');
  }
});

document.getElementById('send-btn')?.addEventListener('click', sendChatMessage);

document.getElementById('chat-input')?.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    sendChatMessage();
  }
});

document.getElementById('ai-feed-close')?.addEventListener('click', closeAIFeedPanel);

document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  setupNavigation();
  initDefaultGroups();
  setupModal();
  loadWikiContent();
});

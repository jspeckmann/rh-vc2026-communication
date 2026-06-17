// ===== Basis-URL und Konfiguration =====
const BASE_URL = '/chat/api'; // Basis-URL für API-Aufrufe
const AUTH_URL = '/auth';     // Authentik-URL für JWT

// ===== Darkmode =====
function checkOSDarkMode() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// Setze initialen Darkmode basierend auf OS-Präferenz oder localStorage
function initDarkMode() {
  const savedTheme = localStorage.getItem('theme');
  const osPrefersDark = checkOSDarkMode();

  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else if (osPrefersDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

// Darkmode-Toggle
document.getElementById('dark-mode-toggle')?.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
});

// Watch for OS dark mode changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
  }
});

// ===== API-Helper mit JWT =====
/**
 * Führt einen API-Aufruf mit JWT-Authentifizierung aus
 * @param {string} endpoint - API-Endpunkt (z. B. '/messages')
 * @param {Object} options - Fetch-Optionen (z. B. { method: 'POST', body: {...} })
 * @returns {Promise<Object>} - JSON-Antwort
 */
async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem('authToken');

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...defaultOptions,
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API-Aufruf fehlgeschlagen:', error);
    throw error;
  }
}

// ===== Navigation =====
const mainNavButtons = document.querySelectorAll('.left-nav .btn-nav');
const subNavButtons = document.querySelectorAll('.sub-nav .btn-subnav');

// Hauptnavigation
mainNavButtons?.forEach(button => {
  button.addEventListener('click', () => {
    // Aktiven Button markieren
    mainNavButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    // Abschnitt anzeigen
    const sectionId = button.id.replace('-btn', '-section');
    showSection(sectionId);
    updateBreadcrumb(button.textContent.trim());

    // Zu zuletzt geöffnet hinzufügen
    addToRecent(button);

    // Spezielle Aktionen
    if (sectionId === 'network-section') {
      initNetworkGraph();
    } else if (button.id === 'ai-feed-btn') {
      toggleAIFeedPanel();
    } else {
      // AI Feed Panel schließen, wenn andere Section ausgewählt
      document.getElementById('ai-feed-panel')?.classList.remove('active');
    }
  });
});

// Sub-Navigation
subNavButtons?.forEach(button => {
  button.addEventListener('click', () => {
    subNavButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
  });
});

function showSection(sectionId) {
  document.querySelectorAll('.section')?.forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById(sectionId)?.classList.add('active');
}

function updateBreadcrumb(text) {
  const breadcrumbCurrent = document.getElementById('breadcrumb-current');
  if (breadcrumbCurrent) {
    breadcrumbCurrent.textContent = text;
  }
}

// ===== AI Feed Panel =====
function toggleAIFeedPanel() {
  const aiFeedPanel = document.getElementById('ai-feed-panel');
  if (!aiFeedPanel) return;

  aiFeedPanel.classList.toggle('active');

  if (aiFeedPanel.classList.contains('active')) {
    loadAIFeedData();
  }
}

// Lädt AI Feed-Daten (Platzhalter für Backend-Anbindung)
async function loadAIFeedData() {
  const aiFeedContent = document.getElementById('ai-feed-content');
  if (!aiFeedContent) return;

  aiFeedContent.innerHTML = '<p class="text-gray">Lade Daten...</p>';

  try {
    // Beispiel: Daten von Backend laden
    // const feedItems = await fetchWithAuth('/ai-feed');
    // Für Demo: Statische Daten
    const feedItems = [
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

    renderAIFeedItems(feedItems);
  } catch (error) {
    aiFeedContent.innerHTML = '<p class="feedback-error">Fehler beim Laden der Daten.</p>';
  }
}

function renderAIFeedItems(items) {
  const aiFeedContent = document.getElementById('ai-feed-content');
  if (!aiFeedContent) return;

  aiFeedContent.innerHTML = '';

  items.forEach(item => {
    const feedItem = document.createElement('div');
    feedItem.className = 'ai-feed-item';
    feedItem.innerHTML = `
      <h4>${item.title}</h4>
      <p>${item.description}</p>
      <div class="meta">${item.time}</div>
    `;
    aiFeedContent.appendChild(feedItem);
  });
}

// Schließe AI Feed Panel
document.getElementById('ai-feed-close')?.addEventListener('click', () => {
  document.getElementById('ai-feed-panel')?.classList.remove('active');
});

// ===== Chat =====
document.getElementById('send-btn')?.addEventListener('click', async () => {
  const input = document.getElementById('chat-input');
  const message = input?.value?.trim();

  if (message) {
    const chatMessages = document.getElementById('chat-messages');

    // Nachricht anzeigen
    if (chatMessages) {
      chatMessages.innerHTML += `<p class="text-main"><strong>Du:</strong> ${message}</p>`;
      input.value = '';
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Beispiel: Nachricht an Backend senden
    try {
      await fetchWithAuth('/messages', {
        method: 'POST',
        body: JSON.stringify({ text: message })
      });
    } catch (error) {
      console.error('Nachricht konnte nicht gesendet werden:', error);
    }
  }
});

// Enter-Taste für Chat-Input
document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('send-btn')?.click();
  }
});

// ===== Gruppen und "Zuletzt geöffnet" =====
function initDefaultGroups() {
  const groupContainer = document.getElementById('group-container');
  if (!groupContainer) return;

  // Hackathon-Projekte
  const group1 = document.createElement('div');
  group1.className = 'group-item';
  group1.innerHTML = `
    <div class="group-header" id="group-header-1">
      <span>
        <span class="icon">📁</span>
        <span>Hackathon-Projekte</span>
      </span>
      <span class="chevron">▼</span>
    </div>
    <div class="group-content active" id="group-content-1">
      <div class="recent-item">
        <span class="icon">💬</span>
        <span>Projekt A Chat</span>
        <button class="close-btn">×</button>
      </div>
      <div class="recent-item">
        <span class="icon">📚</span>
        <span>Projekt A Wiki</span>
        <button class="close-btn">×</button>
      </div>
      <div class="recent-item">
        <span class="icon">🌐</span>
        <span>Projekt A Vernetzung</span>
        <button class="close-btn">×</button>
      </div>
    </div>
  `;
  groupContainer.appendChild(group1);

  // Team-Intern
  const group2 = document.createElement('div');
  group2.className = 'group-item';
  group2.innerHTML = `
    <div class="group-header" id="group-header-2">
      <span>
        <span class="icon">📁</span>
        <span>Team-Intern</span>
      </span>
      <span class="chevron">▼</span>
    </div>
    <div class="group-content" id="group-content-2">
      <div class="recent-item">
        <span class="icon">💬</span>
        <span>Team-Chat</span>
        <button class="close-btn">×</button>
      </div>
    </div>
  `;
  groupContainer.appendChild(group2);

  // Event-Listener für Gruppen-Header
  document.querySelectorAll('.group-header').forEach(header => {
    header.addEventListener('click', () => {
      header.classList.toggle('collapsed');
      const contentId = header.id.replace('group-header-', 'group-content-');
      document.getElementById(contentId)?.classList.toggle('active');
    });
  });

  // Event-Listener für Close-Buttons
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      btn.parentElement?.remove();
    });
  });
}

function addToRecent(button) {
  const recentSection = document.getElementById('recent-items');
  if (!recentSection) return;

  const icon = button.querySelector('.icon')?.textContent || '';
  const text = button.querySelector('span:not(.icon):not(.chevron)')?.textContent || '';

  // Prüfe, ob bereits in "Zuletzt geöffnet"
  const existingItems = recentSection.querySelectorAll('.recent-item');
  for (let item of existingItems) {
    const itemText = item.querySelector('span:not(.icon):not(.chevron)')?.textContent || '';
    if (itemText === text) return;
  }

  // Erstelle neues Element
  const recentItem = document.createElement('div');
  recentItem.className = 'recent-item';
  recentItem.innerHTML = `
    <span class="icon">${icon}</span>
    <span>${text}</span>
    <button class="close-btn">×</button>
  `;

  // Füge am Anfang ein
  if (recentSection.firstChild) {
    recentSection.insertBefore(recentItem, recentSection.firstChild);
  } else {
    recentSection.appendChild(recentItem);
  }

  // Close-Event
  recentItem.querySelector('.close-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    recentItem.remove();
  });

  // Click-Event zum Navigieren
  recentItem.addEventListener('click', () => {
    const buttonId = button.id;
    mainNavButtons.forEach(btn => btn.classList.remove('active'));
    document.getElementById(buttonId)?.classList.add('active');
    showSection(buttonId.replace('-btn', '-section'));
    updateBreadcrumb(text);
  });
}

// ===== Modal für neue Gruppen =====
const addGroupBtn = document.getElementById('add-group-btn');
const modal = document.getElementById('add-group-modal');
const modalClose = document.getElementById('modal-close');
const modalCancel = document.getElementById('modal-cancel');
const modalConfirm = document.getElementById('modal-confirm');
const groupNameInput = document.getElementById('group-name-input');

addGroupBtn?.addEventListener('click', () => {
  if (modal) {
    modal.classList.add('active');
    if (groupNameInput) groupNameInput.value = '';
  }
});

modalClose?.addEventListener('click', () => {
  modal?.classList.remove('active');
});

modalCancel?.addEventListener('click', () => {
  modal?.classList.remove('active');
});

modalConfirm?.addEventListener('click', () => {
  if (groupNameInput && modal) {
    const groupName = groupNameInput.value.trim();
    if (groupName) {
      addNewGroup(groupName);
      modal.classList.remove('active');
    }
  }
});

function addNewGroup(name) {
  const groupContainer = document.getElementById('group-container');
  if (!groupContainer) return;

  const groupId = 'group-' + Date.now();
  const groupItem = document.createElement('div');
  groupItem.className = 'group-item';
  groupItem.innerHTML = `
    <div class="group-header" id="group-header-${groupId}">
      <span>
        <span class="icon">📁</span>
        <span>${name}</span>
      </span>
      <span class="chevron">▼</span>
    </div>
    <div class="group-content" id="group-content-${groupId}"></div>
  `;

  groupContainer.appendChild(groupItem);

  // Event-Listener für neuen Gruppen-Header
  groupItem.querySelector('.group-header')?.addEventListener('click', () => {
    groupItem.querySelector('.group-header')?.classList.toggle('collapsed');
    groupItem.querySelector('.group-content')?.classList.toggle('active');
  });
}

// ===== Initialisierung =====
document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  initDefaultGroups();
});
// =============================================
// KONFIGURATION
// =============================================
const CONFIG = {
  BASE_URL: '/chat/api',       // Basis-URL für API-Aufrufe
  AUTH_URL: '/auth',           // Authentik-URL
  STORAGE_KEYS: {
    THEME: 'theme',
    TOKEN: 'authToken'
  }
};

// =============================================
// DARKMODE
// =============================================
/**
 * Prüft, ob das Betriebssystem Darkmode bevorzugt
 */
function checkOSDarkMode() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Setzt das Theme-Attribut auf dem <html>-Element
 */
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, theme);
}

/**
 * Initialisiert den Darkmode basierend auf localStorage oder OS-Präferenz
 */
function initDarkMode() {
  const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
  const osPrefersDark = checkOSDarkMode();

  if (savedTheme) {
    setTheme(savedTheme);
  } else if (osPrefersDark) {
    setTheme('dark');
  } else {
    setTheme('light');
  }
}

/**
 * Toggle zwischen Lightmode und Darkmode
 */
function toggleDarkMode() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

// =============================================
// API-HELPER (mit JWT)
// =============================================
/**
 * Führt einen API-Aufruf mit JWT-Authentifizierung aus
 */
async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...options
  };

  try {
    const response = await fetch(`${CONFIG.BASE_URL}${endpoint}`, defaultOptions);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('API-Aufruf fehlgeschlagen:', error);
    throw error;
  }
}

// =============================================
// DOM-UTILITIES
// =============================================
/**
 * Zeigt einen Abschnitt an und versteckt alle anderen
 */
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  const section = document.getElementById(sectionId);
  if (section) section.classList.add('active');
}

/**
 * Aktualisiert den Breadcrumb
 */
function updateBreadcrumb(text) {
  const breadcrumbCurrent = document.getElementById('breadcrumb-current');
  if (breadcrumbCurrent) breadcrumbCurrent.textContent = text;
}

// =============================================
// NAVIGATION
// =============================================
/**
 * Initialisiert die Navigation
 */
function initNavigation() {
  // Hauptnavigation
  const mainNavButtons = document.querySelectorAll('.left-nav .btn-nav');
  mainNavButtons.forEach(button => {
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
        if (typeof initNetworkGraph === 'function') initNetworkGraph();
      } else if (button.id === 'ai-feed-btn') {
        toggleAIFeedPanel();
      } else {
        // AI Feed Panel schließen
        const aiFeedPanel = document.getElementById('ai-feed-panel');
        if (aiFeedPanel) aiFeedPanel.classList.remove('active');
      }
    });
  });

  // Sub-Navigation
  const subNavButtons = document.querySelectorAll('.sub-nav .btn-subnav');
  subNavButtons.forEach(button => {
    button.addEventListener('click', () => {
      subNavButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
    });
  });
}

// =============================================
// AI FEED PANEL
// =============================================
/**
 * Toggle AI Feed Panel
 */
function toggleAIFeedPanel() {
  const aiFeedPanel = document.getElementById('ai-feed-panel');
  if (!aiFeedPanel) return;

  aiFeedPanel.classList.toggle('active');

  if (aiFeedPanel.classList.contains('active')) {
    loadAIFeedData();
  }
}

/**
 * Lädt AI Feed-Daten (Platzhalter für Backend-Anbindung)
 */
function loadAIFeedData() {
  const aiFeedContent = document.getElementById('ai-feed-content');
  if (!aiFeedContent) return;

  aiFeedContent.innerHTML = '<p class="text-gray">Lade Daten...</p>';

  // Simuliere API-Aufruf
  setTimeout(() => {
    const feedItems = [
      {
        title: 'Neue Projekt-Updates',
        description: 'Es gibt neue Informationen zu Projekt A in der Vernetzungswolke.',
        time: 'Vor 5 Minuten'
      },
      {
        title: 'Relevante Wiki-Änderungen',
        description: 'Das Wiki wurde von Max aktualisiert.',
        time: 'Vor 12 Minuten'
      },
      {
        title: 'Chat-Nachricht für dich',
        description: 'Lisa hat eine Nachricht in dem Team-Chat hinterlassen.',
        time: 'Vor 25 Minuten'
      }
    ];

    renderAIFeedItems(feedItems);
  }, 500);
}

/**
 * Rendert AI Feed-Items
 */
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

// =============================================
// CHAT
// =============================================
/**
 * Initialisiert den Chat
 */
function initChat() {
  const sendBtn = document.getElementById('send-btn');
  const chatInput = document.getElementById('chat-input');

  if (!sendBtn || !chatInput) return;

  sendBtn.addEventListener('click', () => {
    const message = chatInput.value.trim();
    if (message) {
      const chatMessages = document.getElementById('chat-messages');
      if (chatMessages) {
        chatMessages.innerHTML += `<p class="text-main"><strong>Du:</strong> ${message}</p>`;
        chatInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }

      // Beispiel: Nachricht an Backend senden
      fetchWithAuth('/messages', {
        method: 'POST',
        body: JSON.stringify({ text: message })
      }).catch(console.error);
    }
  });

  // Enter-Taste für Chat-Input
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendBtn.click();
  });
}

// =============================================
// GRUPPEN & ZULETZT GEÖFFNET
// =============================================
/**
 * Fügt ein Element zu "Zuletzt geöffnet" hinzu
 */
function addToRecent(button) {
  const recentSection = document.getElementById('recent-items');
  if (!recentSection) return;

  const icon = button.querySelector('.icon')?.textContent || '';
  const text = button.querySelector('span:not(.icon):not(.chevron)')?.textContent || '';

  // Prüfe, ob bereits vorhanden
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
    document.querySelectorAll('.left-nav .btn-nav').forEach(btn => {
      btn.classList.remove('active');
    });
    document.getElementById(buttonId)?.classList.add('active');
    showSection(buttonId.replace('-btn', '-section'));
    updateBreadcrumb(text);
  });
}

/**
 * Initialisiert die Standard-Gruppen
 */
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

/**
 * Fügt eine neue Gruppe hinzu
 */
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

// =============================================
// MODAL FÜR NEUE GRUPPEN
// =============================================
/**
 * Initialisiert das Modal für neue Gruppen
 */
function initModal() {
  const addGroupBtn = document.getElementById('add-group-btn');
  const modal = document.getElementById('add-group-modal');
  const modalClose = document.getElementById('modal-close');
  const modalCancel = document.getElementById('modal-cancel');
  const modalConfirm = document.getElementById('modal-confirm');
  const groupNameInput = document.getElementById('group-name-input');

  if (!addGroupBtn || !modal) return;

  addGroupBtn.addEventListener('click', () => {
    modal.classList.add('active');
    if (groupNameInput) groupNameInput.value = '';
  });

  modalClose?.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  modalCancel?.addEventListener('click', () => {
    modal.classList.remove('active');
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
}

// =============================================
// INITIALISIERUNG
// =============================================
/**
 * Initialisiert alle Funktionen beim Laden der Seite
 */
function initApp() {
  // Darkmode initialisieren
  initDarkMode();

  // Darkmode-Toggle
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', toggleDarkMode);
  }

  // OS Darkmode-Änderungen beobachten
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(CONFIG.STORAGE_KEYS.THEME)) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });

  // Navigation initialisieren
  initNavigation();

  // Chat initialisieren
  initChat();

  // Standard-Gruppen initialisieren
  initDefaultGroups();

  // Modal initialisieren
  initModal();

  // AI Feed Panel schließen
  const aiFeedClose = document.getElementById('ai-feed-close');
  if (aiFeedClose) {
    aiFeedClose.addEventListener('click', () => {
      const aiFeedPanel = document.getElementById('ai-feed-panel');
      if (aiFeedPanel) aiFeedPanel.classList.remove('active');
    });
  }
}

// =============================================
// SEITE LADEN
// =============================================
// Warte, bis das DOM vollständig geladen ist
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
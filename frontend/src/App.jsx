import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/layout/Header.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import Breadcrumb from './components/layout/Breadcrumb.jsx';
import SubNav from './components/layout/SubNav.jsx';
import ChatSection from './components/chat/ChatSection.jsx';
import WikiSection from './components/wiki/WikiSection.jsx';
import NetworkSection from './components/network/NetworkSection.jsx';
import AIFeedPanel from './components/ai-feed/AIFeedPanel.jsx';
import AddGroupModal from './components/groups/AddGroupModal.jsx';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { useDarkMode } from './hooks/useDarkMode.js';
import { defaultGroups } from './data/mocks.js';

const sectionLabels = {
  chat: 'Chat',
  wiki: 'Wiki',
  network: 'Vernetzungswolke',
};

export default function App() {
  const { theme, toggleTheme } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [aiFeedOpen, setAIFeedOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [recentItems, setRecentItems] = useLocalStorage('recentItems', []);
  const [groups, setGroups] = useLocalStorage('groups', defaultGroups);

  const currentSection = location.pathname.replace('/', '') || 'chat';
  const breadcrumbLabel = sectionLabels[currentSection] || 'Chat';

  useEffect(() => {
    document.title = `CPP — Kommunikation — ${breadcrumbLabel}`;
  }, [breadcrumbLabel]);

  const handleNavigate = useCallback((section) => {
    if (section === 'ai-feed') {
      setAIFeedOpen(true);
      return;
    }
    setAIFeedOpen(false);
    navigate(`/${section}`);
  }, [navigate]);

  useEffect(() => {
    const label = sectionLabels[currentSection];
    if (!label) return;
    const iconMap = { chat: '\u{1F4AC}', wiki: '\u{1F4DA}', network: '\u{1F310}' };
    setRecentItems((prev) => {
      const exists = prev.some((item) => item.route === currentSection);
      if (exists) return prev;
      return [
        ...prev,
        { id: `${currentSection}-btn`, route: currentSection, label, icon: iconMap[currentSection] || '' },
      ];
    });
  }, [currentSection, setRecentItems]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setModalOpen(false);
        setAIFeedOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="flex h-screen relative bg-[var(--color-bg)] text-[var(--color-fg)]">
      <Header theme={theme} toggleTheme={toggleTheme} />

      <Sidebar
        onNavigate={handleNavigate}
        onToggleAIFeed={() => setAIFeedOpen((prev) => !prev)}
        onOpenModal={() => setModalOpen(true)}
        currentSection={currentSection}
        groups={groups}
        setGroups={setGroups}
        recentItems={recentItems}
        setRecentItems={setRecentItems}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Breadcrumb label={breadcrumbLabel} />
        <SubNav activeFilter={filter} onFilterChange={setFilter} visible={currentSection === 'chat'} />
        <div className="flex-1 overflow-y-auto p-6 bg-[var(--color-bg)]">
          <Routes>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/chat" element={<ChatSection filter={filter} />} />
            <Route path="/wiki" element={<WikiSection />} />
            <Route path="/network" element={<NetworkSection />} />
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </div>
      </div>

      <AIFeedPanel open={aiFeedOpen} onClose={() => setAIFeedOpen(false)} />

      <AddGroupModal open={modalOpen} onClose={() => setModalOpen(false)} groups={groups} setGroups={setGroups} />
    </div>
  );
}

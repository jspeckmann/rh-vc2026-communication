import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/layout/Header.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import Breadcrumb from './components/layout/Breadcrumb.jsx';
import SubNav from './components/layout/SubNav.jsx';
import DashboardSection from './components/dashboard/DashboardSection.jsx';
import ChatSection from './components/chat/ChatSection.jsx';
import WikiSection from './components/wiki/WikiSection.jsx';
import NetworkSection from './components/network/NetworkSection.jsx';
import AIFeedPanel from './components/ai-feed/AIFeedPanel.jsx';
import GroupsSection from './components/groups/GroupsSection.jsx';
import AddGroupModal from './components/groups/AddGroupModal.jsx';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { useDarkMode } from './hooks/useDarkMode.js';
import { DEFAULT_GROUP_ID, DEFAULT_USER_ID, fetchGroups, fetchUsers } from './services/api.js';

const sectionLabels = {
  dashboard: 'Dashboard',
  groups: 'Gruppen',
  chat: 'Chat',
  wiki: 'Wiki',
  network: 'Vernetzungswolke',
};

function pickKnownId(currentId, items, fallbackId) {
  if (items.some((item) => item.id === currentId)) return currentId;
  if (items.some((item) => item.id === fallbackId)) return fallbackId;
  return items[0]?.id ?? fallbackId;
}

export default function App() {
  const { theme, toggleTheme } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [aiFeedOpen, setAIFeedOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [recentItems, setRecentItems] = useLocalStorage('recentItems', []);
  const [selectedGroupId, setSelectedGroupId] = useLocalStorage('communicationSelectedGroupId', '');
  const [selectedUserId, setSelectedUserId] = useLocalStorage('communicationSelectedUserId', '');
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [groupsLoadError, setGroupsLoadError] = useState(false);
  const [usersLoadError, setUsersLoadError] = useState(false);

  const currentSection = location.pathname.replace('/', '') || 'chat';
  const breadcrumbLabel = sectionLabels[currentSection] || 'Chat';
  const selectedGroupKnown = groups.some((group) => group.id === selectedGroupId);
  const selectedUserKnown = users.some((user) => user.id === selectedUserId);

  useEffect(() => {
    document.title = `CPP - Kommunikation - ${breadcrumbLabel}`;
  }, [breadcrumbLabel]);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([fetchGroups(), fetchUsers()]).then(([groupsResult, usersResult]) => {
      if (cancelled) return;

      if (groupsResult.status === 'fulfilled') {
        const nextGroups = groupsResult.value;
        setGroups((current) => (
          nextGroups.map((group) => ({
            ...group,
            collapsed: current.find((item) => item.id === group.id)?.collapsed ?? false,
          }))
        ));
        setSelectedGroupId((current) => pickKnownId(current, nextGroups, DEFAULT_GROUP_ID));
        setGroupsLoadError(false);
      } else {
        setGroupsLoadError(true);
      }

      if (usersResult.status === 'fulfilled') {
        const nextUsers = usersResult.value;
        setUsers(nextUsers);
        setSelectedUserId((current) => pickKnownId(current, nextUsers, DEFAULT_USER_ID));
        setUsersLoadError(false);
      } else {
        setUsersLoadError(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [setSelectedGroupId, setSelectedUserId]);

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
    const iconMap = {
      dashboard: 'dashboard',
      groups: 'groups',
      chat: 'chat',
      wiki: 'wiki',
      network: 'network',
    };
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
    <div className="app-frame relative flex h-screen overflow-hidden">
      <Header theme={theme} toggleTheme={toggleTheme} />

      <Sidebar
        onNavigate={handleNavigate}
        onToggleAIFeed={() => setAIFeedOpen((prev) => !prev)}
        onOpenModal={() => setModalOpen(true)}
        currentSection={currentSection}
        groups={groups}
        setGroups={setGroups}
        groupsLoadError={groupsLoadError}
        recentItems={recentItems}
        setRecentItems={setRecentItems}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Breadcrumb label={breadcrumbLabel} />
        <SubNav activeFilter={filter} onFilterChange={setFilter} visible={currentSection === 'chat'} />
        <div className="app-content flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/dashboard" element={<DashboardSection onNavigate={handleNavigate} />} />
            <Route
              path="/groups"
              element={(
                <GroupsSection
                  groups={groups}
                  setGroups={setGroups}
                  groupsLoadError={groupsLoadError}
                  users={users}
                  usersLoadError={usersLoadError}
                  selectedGroupId={selectedGroupId}
                  onSelectGroup={setSelectedGroupId}
                  selectedUserId={selectedUserId}
                  selectedUserKnown={selectedUserKnown}
                />
              )}
            />
            <Route
              path="/chat"
              element={(
                <ChatSection
                  filter={filter}
                  groups={groups}
                  users={users}
                  selectedGroupId={selectedGroupId}
                  onSelectGroup={setSelectedGroupId}
                  selectedUserId={selectedUserId}
                  onSelectUser={setSelectedUserId}
                  selectedUserKnown={selectedUserKnown}
                />
              )}
            />
            <Route
              path="/wiki"
              element={(
                <WikiSection
                  groups={groups}
                  users={users}
                  selectedGroupId={selectedGroupId}
                  onSelectGroup={setSelectedGroupId}
                  selectedUserId={selectedUserId}
                  selectedUserKnown={selectedUserKnown}
                  selectedGroupKnown={selectedGroupKnown}
                />
              )}
            />
            <Route
              path="/network"
              element={<NetworkSection selectedGroupId={selectedGroupId} selectedGroupKnown={selectedGroupKnown} />}
            />
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </div>
      </div>

      <AIFeedPanel
        open={aiFeedOpen}
        onClose={() => setAIFeedOpen(false)}
        selectedGroupId={selectedGroupId}
        selectedUserId={selectedUserId}
        selectedUserKnown={selectedUserKnown}
      />

      <AddGroupModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        groups={groups}
        setGroups={setGroups}
        currentUserId={selectedUserId}
        canCreate={selectedUserKnown}
        onCreated={(group) => setSelectedGroupId(group.id)}
      />
    </div>
  );
}

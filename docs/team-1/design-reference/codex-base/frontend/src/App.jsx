import { useCallback, useEffect, useMemo, useState } from "react";
import {
  analyzeAgent,
  createAgentFeedback,
  createMessage,
  createThread,
  fetchAgentItem,
  fetchBootstrap,
  fetchGroupDetails,
  fetchMessages,
  fetchThreads,
  fetchWikiArticle,
} from "./api/chatApi.js";
import { ErrorState, LoadingState } from "./components/common.jsx";
import {
  AgentView,
  AppShell,
  ChatView,
  DashboardView,
  DetailRail,
  GroupsView,
  KnowledgeGraphView,
  WikiView,
} from "./components/views.jsx";

const emptyDashboard = {
  status: {},
  groups: [],
  feed: [],
  wiki: [],
  agentFeed: [],
  knowledgeGraph: { nodeCount: 0, edgeCount: 0 },
};

function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [theme, setTheme] = useState("light");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isWorking, setIsWorking] = useState(false);

  const [index, setIndex] = useState(null);
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [wiki, setWiki] = useState([]);
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [agentFeed, setAgentFeed] = useState([]);
  const [matrixRooms, setMatrixRooms] = useState([]);

  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [selectedArticleId, setSelectedArticleId] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [groupDetails, setGroupDetails] = useState(null);
  const [articleDetails, setArticleDetails] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [messageDraft, setMessageDraft] = useState("");
  const [threadDraft, setThreadDraft] = useState({
    title: "",
    type: "discussion",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await fetchBootstrap();
      const nextGroupId = selectedGroupId || payload.groups[0]?.id || "";
      const nextThreadId =
        selectedThreadId ||
        payload.threads.find((thread) => thread.groupId === nextGroupId)?.id ||
        payload.threads[0]?.id ||
        "";
      const nextArticleId = selectedArticleId || payload.wiki[0]?.id || "";
      const nextAgentId = selectedAgentId || payload.agentFeed[0]?.id || "";
      const nextUserId = selectedUserId || payload.users[0]?.id || "";

      setIndex(payload.index);
      setDashboard(payload.dashboard);
      setUsers(payload.users);
      setGroups(payload.groups);
      setThreads(payload.threads);
      setWiki(payload.wiki);
      setGraph(payload.graph);
      setAgentFeed(payload.agentFeed);
      setMatrixRooms(payload.matrixRooms);
      setSelectedGroupId(nextGroupId);
      setSelectedThreadId(nextThreadId);
      setSelectedArticleId(nextArticleId);
      setSelectedAgentId(nextAgentId);
      setSelectedUserId(nextUserId);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [selectedAgentId, selectedArticleId, selectedGroupId, selectedThreadId, selectedUserId]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedGroupId) return;
    fetchGroupDetails(selectedGroupId)
      .then(setGroupDetails)
      .catch((groupError) => setError(groupError.message));
  }, [selectedGroupId]);

  useEffect(() => {
    if (!selectedThreadId) {
      setMessages([]);
      return;
    }
    fetchMessages(selectedThreadId)
      .then(setMessages)
      .catch((messageError) => setError(messageError.message));
  }, [selectedThreadId]);

  useEffect(() => {
    if (!selectedArticleId) {
      setArticleDetails(null);
      return;
    }
    fetchWikiArticle(selectedArticleId)
      .then(setArticleDetails)
      .catch((articleError) => setError(articleError.message));
  }, [selectedArticleId]);

  useEffect(() => {
    if (!selectedAgentId) {
      setSelectedAgent(null);
      return;
    }
    fetchAgentItem(selectedAgentId)
      .then(setSelectedAgent)
      .catch((agentError) => setError(agentError.message));
  }, [selectedAgentId]);

  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const selectedGroup = groups.find((group) => group.id === selectedGroupId);
  const selectedThread = threads.find((thread) => thread.id === selectedThreadId);

  const handleGroupChange = async (groupId) => {
    setSelectedGroupId(groupId);
    const nextThreads = await fetchThreads(groupId);
    setThreads((currentThreads) => {
      const otherThreads = currentThreads.filter((thread) => thread.groupId !== groupId);
      return [...otherThreads, ...nextThreads];
    });
    setSelectedThreadId(nextThreads[0]?.id ?? "");
  };

  const handleCreateThread = async (event) => {
    event.preventDefault();
    if (!threadDraft.title.trim() || !selectedGroupId || !selectedUserId) return;
    setIsWorking(true);
    try {
      const thread = await createThread({
        groupId: selectedGroupId,
        title: threadDraft.title.trim(),
        type: threadDraft.type,
        createdBy: selectedUserId,
      });
      setThreads((currentThreads) => [...currentThreads, thread]);
      setSelectedThreadId(thread.id);
      setThreadDraft({ title: "", type: "discussion" });
    } catch (threadError) {
      setError(threadError.message);
    } finally {
      setIsWorking(false);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!messageDraft.trim() || !selectedThreadId || !selectedUserId) return;
    setIsWorking(true);
    try {
      const message = await createMessage(selectedThreadId, {
        authorId: selectedUserId,
        body: messageDraft.trim(),
      });
      setMessages((currentMessages) => [...currentMessages, message]);
      setMessageDraft("");
    } catch (messageError) {
      setError(messageError.message);
    } finally {
      setIsWorking(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedGroupId) return;
    setIsWorking(true);
    try {
      const result = await analyzeAgent({
        groupId: selectedGroupId,
        sourceType: selectedThreadId ? "thread" : "manual",
        sourceId: selectedThreadId || selectedGroupId,
        mode: "mock",
      });
      const created = result.createdItems?.[0];
      await loadData();
      if (created) {
        setSelectedAgentId(created.id);
        setSelectedAgent(await fetchAgentItem(created.id));
      }
      setActiveView("agent");
    } catch (agentError) {
      setError(agentError.message);
    } finally {
      setIsWorking(false);
    }
  };

  const handleFeedback = async (value) => {
    if (!selectedAgentId || !selectedUserId) return;
    setIsWorking(true);
    try {
      await createAgentFeedback(selectedAgentId, {
        userId: selectedUserId,
        value,
        reason: null,
      });
      setSelectedAgent(await fetchAgentItem(selectedAgentId));
    } catch (feedbackError) {
      setError(feedbackError.message);
    } finally {
      setIsWorking(false);
    }
  };

  const renderView = () => {
    switch (activeView) {
      case "groups":
        return (
          <GroupsView
            groups={groups}
            selectedGroupId={selectedGroupId}
            onSelectGroup={handleGroupChange}
            groupDetails={groupDetails}
            matrixRooms={matrixRooms}
          />
        );
      case "chat":
        return (
          <ChatView
            groups={groups}
            threads={threads}
            messages={messages}
            selectedGroupId={selectedGroupId}
            selectedThreadId={selectedThreadId}
            selectedUserId={selectedUserId}
            usersById={usersById}
            messageDraft={messageDraft}
            threadDraft={threadDraft}
            onGroupChange={handleGroupChange}
            onThreadChange={setSelectedThreadId}
            onMessageDraftChange={setMessageDraft}
            onThreadDraftChange={setThreadDraft}
            onSendMessage={handleSendMessage}
            onCreateThread={handleCreateThread}
            isSending={isWorking}
          />
        );
      case "wiki":
        return (
          <WikiView
            articles={wiki}
            selectedArticleId={selectedArticleId}
            articleDetails={articleDetails}
            onSelectArticle={setSelectedArticleId}
          />
        );
      case "graph":
        return <KnowledgeGraphView graph={graph} />;
      case "agent":
        return (
          <AgentView
            items={agentFeed}
            selectedAgentId={selectedAgentId}
            selectedAgent={selectedAgent}
            onSelectAgent={setSelectedAgentId}
            onAnalyze={handleAnalyze}
            onFeedback={handleFeedback}
            isWorking={isWorking}
          />
        );
      case "dashboard":
      default:
        return (
          <DashboardView
            dashboard={dashboard}
            users={users}
            groups={groups}
            onOpenView={setActiveView}
          />
        );
    }
  };

  if (loading) {
    return <LoadingState label="Kommunikationsmodul laedt" />;
  }

  if (error && !groups.length) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <AppShell
      activeView={activeView}
      onViewChange={setActiveView}
      status={dashboard.status ?? {}}
      index={index}
      theme={theme}
      onThemeToggle={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
      selectedUserId={selectedUserId}
      users={users}
      onUserChange={setSelectedUserId}
      detail={
        <DetailRail
          selectedGroup={selectedGroup}
          selectedThread={selectedThread}
          selectedArticle={articleDetails}
          selectedAgent={selectedAgent}
          matrixRooms={matrixRooms}
        />
      }
    >
      {error ? <ErrorState message={error} onRetry={loadData} /> : null}
      {renderView()}
    </AppShell>
  );
}

export default App;

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_GROUP_ID,
  DEFAULT_USER_ID,
  createThread,
  fetchGroups,
  fetchMessages,
  fetchThreads,
  fetchUsers,
  formatTime,
  sendMessage as sendMsg,
} from '../../services/api.js';

export default function ChatSection({ filter }) {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(DEFAULT_GROUP_ID);
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(DEFAULT_USER_ID);
  const [input, setInput] = useState('');
  const [threadTitle, setThreadTitle] = useState('');
  const [threadType, setThreadType] = useState('discussion');
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [messageError, setMessageError] = useState(false);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  const usersById = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );

  useEffect(() => {
    let cancelled = false;
    inputRef.current?.focus();

    Promise.all([fetchGroups(), fetchUsers()])
      .then(async ([nextGroups, nextUsers]) => {
        const nextGroupId = nextGroups.some((group) => group.id === DEFAULT_GROUP_ID)
          ? DEFAULT_GROUP_ID
          : nextGroups[0]?.id ?? DEFAULT_GROUP_ID;
        const nextThreads = await fetchThreads(nextGroupId);
        if (cancelled) return;
        setGroups(nextGroups);
        setUsers(nextUsers);
        setSelectedGroupId(nextGroupId);
        setThreads(nextThreads);
        if (nextThreads[0]?.id) setMessageLoading(true);
        setSelectedThreadId(nextThreads[0]?.id ?? '');
        setLoadError(false);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!selectedThreadId) {
      return () => {
        cancelled = true;
      };
    }

    fetchMessages(selectedThreadId)
      .then((data) => {
        if (!cancelled) {
          setMessages(data);
          setMessageError(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMessages([]);
          setMessageError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setMessageLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedThreadId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const groupThreads = useMemo(
    () => threads.filter((thread) => thread.groupId === selectedGroupId),
    [threads, selectedGroupId],
  );

  const filtered = useMemo(() => {
    switch (filter) {
      case 'recent':
        return messages.slice(-5);
      case 'favorites':
        return messages.filter((message) => message.priorityLabel === 'high');
      default:
        return messages;
    }
  }, [filter, messages]);

  const handleGroupChange = async (groupId) => {
    setSelectedGroupId(groupId);
    setMessageLoading(true);
    try {
      const nextThreads = await fetchThreads(groupId);
      setThreads((current) => {
        const otherGroups = current.filter((thread) => thread.groupId !== groupId);
        return [...otherGroups, ...nextThreads];
      });
      setSelectedThreadId(nextThreads[0]?.id ?? '');
      if (nextThreads.length === 0) setMessages([]);
      setLoadError(false);
      setMessageError(false);
    } catch {
      setMessages([]);
      setLoadError(true);
      setMessageError(true);
    } finally {
      setMessageLoading(false);
    }
  };

  const handleCreateThread = async (event) => {
    event.preventDefault();
    const title = threadTitle.trim();
    if (!title || !selectedGroupId) return;
    setSending(true);
    try {
      const thread = await createThread({
        groupId: selectedGroupId,
        title,
        type: threadType,
        createdBy: selectedUserId,
      });
      setThreads((current) => [...current, thread]);
      setMessageLoading(true);
      setSelectedThreadId(thread.id);
      setThreadTitle('');
      setThreadType('discussion');
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setSending(false);
    }
  };

  const handleSend = async (event) => {
    event?.preventDefault();
    const text = input.trim();
    if (!text || !selectedThreadId) return;
    const tempId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        threadId: selectedThreadId,
        authorId: selectedUserId,
        body: text,
        priorityLabel: 'sendet',
        createdAt: new Date().toISOString(),
      },
    ]);
    setInput('');
    setSending(true);

    try {
      const created = await sendMsg(selectedThreadId, text, selectedUserId);
      setMessages((prev) => prev.map((message) => (message.id === tempId ? created : message)));
    } catch {
      setMessages((prev) =>
        prev.map((message) => (
          message.id === tempId
            ? { ...message, priorityLabel: 'nicht gesendet' }
            : message
        )),
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[320px_1fr]">
      <section className="min-h-0 overflow-y-auto rounded border border-[var(--color-gray)]/20 bg-[var(--color-content)] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Raeume</h2>
          <select
            aria-label="Aktiver User"
            value={selectedUserId}
            onChange={(event) => setSelectedUserId(event.target.value)}
            className="max-w-36 rounded border border-[var(--color-gray)]/25 bg-[var(--color-content)] px-2 py-1 text-xs"
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.displayName}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-[var(--color-gray)]">Lade Chat...</p>
        ) : loadError ? (
          <p className="text-sm text-[var(--color-error)]">Chat konnte nicht geladen werden.</p>
        ) : (
          <>
            <div className="mb-4 space-y-2">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => handleGroupChange(group.id)}
                  aria-current={group.id === selectedGroupId ? 'page' : undefined}
                  className={`w-full rounded border px-3 py-2 text-left text-sm transition-colors duration-150 ${
                    group.id === selectedGroupId
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                      : 'border-[var(--color-gray)]/15 hover:border-[var(--color-accent)]'
                  }`}
                >
                  <strong className="block">{group.name}</strong>
                  <span className="block truncate text-xs text-[var(--color-gray)]">{group.description}</span>
                </button>
              ))}
            </div>

            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-gray)]">
              Threads
            </h3>
            <div className="space-y-2">
              {groupThreads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => {
                    setMessageLoading(true);
                    setSelectedThreadId(thread.id);
                  }}
                  aria-current={thread.id === selectedThreadId ? 'page' : undefined}
                  className={`w-full rounded border px-3 py-2 text-left text-sm transition-colors duration-150 ${
                    thread.id === selectedThreadId
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                      : 'border-[var(--color-gray)]/15 hover:border-[var(--color-accent)]'
                  }`}
                >
                  <strong className="block">{thread.title}</strong>
                  <span className="block text-xs text-[var(--color-gray)]">{thread.type} / {thread.status}</span>
                </button>
              ))}
            </div>

	            <form className="mt-4 space-y-2 border-t border-[var(--color-gray)]/15 pt-4" onSubmit={handleCreateThread}>
	              <input
                aria-label="Neuer Thread"
	                value={threadTitle}
                onChange={(event) => setThreadTitle(event.target.value)}
                placeholder="Neuer Thread"
                className="w-full rounded border border-[var(--color-gray)]/25 bg-[var(--color-content)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
              />
              <div className="flex gap-2">
	                <select
                  aria-label="Thread-Typ"
	                  value={threadType}
                  onChange={(event) => setThreadType(event.target.value)}
                  className="min-w-0 flex-1 rounded border border-[var(--color-gray)]/25 bg-[var(--color-content)] px-2 py-2 text-sm"
                >
                  <option value="discussion">Diskussion</option>
                  <option value="question">Frage</option>
                  <option value="decision">Entscheidung</option>
                </select>
                <button
                  type="submit"
                  disabled={!threadTitle.trim() || sending}
                  className="rounded bg-[var(--color-accent)] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anlegen
                </button>
              </div>
            </form>
          </>
        )}
      </section>

      <section className="flex min-h-0 flex-col rounded border border-[var(--color-gray)]/20 bg-[var(--color-content)]">
        <div className="border-b border-[var(--color-gray)]/15 px-4 py-3">
          <h2 className="text-sm font-semibold">
            {groupThreads.find((thread) => thread.id === selectedThreadId)?.title ?? 'Matrix Chat'}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {messageLoading ? (
            <p className="text-sm text-[var(--color-gray)]">Lade Nachrichten...</p>
          ) : messageError ? (
            <p className="text-sm text-[var(--color-error)]">Nachrichten konnten nicht geladen werden.</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-[var(--color-gray)]">Keine Nachrichten.</p>
          ) : (
            filtered.map((message) => (
              <article
                key={message.id}
                className={`mb-3 max-w-[720px] rounded border px-3 py-2 text-sm last:mb-0 ${
                  message.authorId === selectedUserId
                    ? 'ml-auto border-[var(--color-accent)]/25 bg-[var(--color-accent)]/10'
                    : 'border-[var(--color-gray)]/15 bg-[var(--color-bg)]'
                }`}
              >
                <header className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--color-gray)]">
                  <strong className="text-[var(--color-fg)]">
                    {usersById.get(message.authorId)?.displayName ?? message.authorId}
                  </strong>
                  <span>{formatTime(message.createdAt)}</span>
                  <span>{message.priorityLabel}</span>
                </header>
                <p>{message.body}</p>
              </article>
            ))
          )}
          <div ref={endRef} />
        </div>

        <form className="flex gap-2 border-t border-[var(--color-gray)]/15 p-3" onSubmit={handleSend}>
          <input
            ref={inputRef}
            aria-label="Nachricht"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Nachricht eingeben..."
            disabled={!selectedThreadId}
            className="min-w-0 flex-1 rounded border border-[var(--color-gray)]/30 bg-[var(--color-content)] px-3 py-2 text-sm text-[var(--color-fg)] outline-none focus:border-[var(--color-accent)] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || !selectedThreadId || sending}
            className="cursor-pointer rounded bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Senden
          </button>
        </form>
      </section>
    </div>
  );
}

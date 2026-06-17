import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createThread,
  fetchMessages,
  fetchThreads,
  formatTime,
  sendMessage as sendMsg,
} from '../../services/api.js';

export default function ChatSection({
  filter,
  groups,
  users,
  selectedGroupId,
  onSelectGroup,
  selectedUserId,
  onSelectUser,
  selectedUserKnown,
}) {
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState('');
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
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!selectedGroupId) {
      queueMicrotask(() => {
        if (cancelled) return;
        setThreads([]);
        setMessages([]);
        setSelectedThreadId('');
        setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }

    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    fetchThreads(selectedGroupId)
      .then((nextThreads) => {
        if (cancelled) return;
        setThreads(nextThreads);
        setSelectedThreadId(nextThreads[0]?.id ?? '');
        if (nextThreads.length === 0) setMessages([]);
        setLoadError(false);
        setMessageError(false);
      })
      .catch(() => {
        if (!cancelled) {
          setThreads([]);
          setMessages([]);
          setSelectedThreadId('');
          setLoadError(true);
          setMessageError(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedGroupId]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedThreadId) {
      queueMicrotask(() => {
        if (cancelled) return;
        setMessages([]);
        setMessageLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }

    queueMicrotask(() => {
      if (!cancelled) setMessageLoading(true);
    });
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

  const selectedThread = groupThreads.find((thread) => thread.id === selectedThreadId);
  const selectedGroup = groups.find((group) => group.id === selectedGroupId);

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

  const handleGroupChange = (groupId) => {
    onSelectGroup(groupId);
    setSelectedThreadId('');
    setMessages([]);
  };

  const handleCreateThread = async (event) => {
    event.preventDefault();
    const title = threadTitle.trim();
    if (!title || !selectedGroupId || !selectedUserKnown) return;
    setSending(true);
    try {
      const thread = await createThread({
        groupId: selectedGroupId,
        title,
        type: threadType,
        createdBy: selectedUserId,
      });
      setThreads((current) => [...current, thread]);
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

  const markMessageFailed = (messageId) => {
    setMessages((prev) =>
      prev.map((message) => (
        message.id === messageId
          ? {
              ...message,
              pending: false,
              sendError: true,
              priorityLabel: 'nicht gesendet',
            }
          : message
      )),
    );
  };

  const persistMessage = async (messageId, threadId, body) => {
    setSending(true);
    try {
      const created = await sendMsg(threadId, body, selectedUserId);
      setMessages((prev) => prev.map((message) => (message.id === messageId ? created : message)));
      setMessageError(false);
    } catch {
      markMessageFailed(messageId);
    } finally {
      setSending(false);
    }
  };

  const handleSend = async (event) => {
    event?.preventDefault();
    const text = input.trim();
    if (!text || !selectedThreadId || !selectedUserKnown) return;
    const tempId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        threadId: selectedThreadId,
        authorId: selectedUserId,
        body: text,
        priorityLabel: 'sendet',
        pending: true,
        sendError: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    setInput('');
    await persistMessage(tempId, selectedThreadId, text);
  };

  const handleRetry = (message) => {
    if (!selectedUserKnown || sending) return;
    setMessages((prev) =>
      prev.map((item) => (
        item.id === message.id
          ? { ...item, pending: true, sendError: false, priorityLabel: 'sendet' }
          : item
      )),
    );
    persistMessage(message.id, message.threadId, message.body);
  };

  const handleRemoveFailed = (messageId) => {
    setMessages((prev) => prev.filter((message) => message.id !== messageId));
  };

  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[300px_minmax(0,1fr)_300px]">
      <section className="ui-panel min-h-0 overflow-y-auto p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Gruppen</h2>
          <select
            aria-label="Aktiver User"
            value={selectedUserKnown ? selectedUserId : ''}
            onChange={(event) => onSelectUser(event.target.value)}
            disabled={users.length === 0}
            className="max-w-36 rounded border border-[var(--color-gray)]/25 bg-[var(--color-content)] px-2 py-1 text-xs disabled:opacity-60"
          >
            {users.length === 0 ? <option value="">Kein User</option> : null}
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
              {groups.length === 0 ? (
                <p className="text-sm text-[var(--color-gray)]">Keine Gruppen.</p>
              ) : (
                groups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => handleGroupChange(group.id)}
                    aria-current={group.id === selectedGroupId ? 'page' : undefined}
                    className={`w-full rounded-[8px] border px-3 py-2 text-left text-sm transition-colors duration-150 ${
                      group.id === selectedGroupId
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                        : 'border-[var(--color-gray)]/15 hover:border-[var(--color-accent)]'
                    }`}
                  >
                    <strong className="block">{group.name}</strong>
                    <span className="block truncate text-xs text-[var(--color-gray)]">{group.description}</span>
                  </button>
                ))
              )}
            </div>

            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-gray)]">
              Threads
            </h3>
            <div className="space-y-2">
              {groupThreads.length === 0 ? (
                <p className="text-sm text-[var(--color-gray)]">Keine Threads.</p>
              ) : (
                groupThreads.map((thread) => (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setSelectedThreadId(thread.id)}
                    aria-current={thread.id === selectedThreadId ? 'page' : undefined}
                    className={`w-full rounded-[8px] border px-3 py-2 text-left text-sm transition-colors duration-150 ${
                      thread.id === selectedThreadId
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                        : 'border-[var(--color-gray)]/15 hover:border-[var(--color-accent)]'
                    }`}
                  >
                    <strong className="block">{thread.title}</strong>
                    <span className="block text-xs text-[var(--color-gray)]">{thread.type} / {thread.status}</span>
                  </button>
                ))
              )}
            </div>

            <form className="mt-4 space-y-2 border-t border-[var(--color-gray)]/15 pt-4" onSubmit={handleCreateThread}>
              <input
                aria-label="Neuer Thread"
                value={threadTitle}
                onChange={(event) => setThreadTitle(event.target.value)}
                placeholder="Neuer Thread"
                className="ui-input w-full px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <select
                  aria-label="Thread-Typ"
                  value={threadType}
                  onChange={(event) => setThreadType(event.target.value)}
                  className="ui-input min-w-0 flex-1 px-2 py-2 text-sm"
                >
                  <option value="discussion">Diskussion</option>
                  <option value="question">Frage</option>
                  <option value="decision">Entscheidung</option>
                </select>
                <button
                  type="submit"
                  disabled={!threadTitle.trim() || !selectedUserKnown || sending}
                  className="ui-button ui-button-primary px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anlegen
                </button>
              </div>
              {!selectedUserKnown ? (
                <p className="text-xs text-[var(--color-error)]">Erst einen gueltigen User waehlen.</p>
              ) : null}
            </form>
          </>
        )}
      </section>

      <section className="ui-panel flex min-h-0 flex-col overflow-hidden">
        <div className="border-b border-[var(--color-gray)]/15 px-4 py-3">
          <h2 className="text-sm font-semibold">
            {selectedThread?.title ?? 'Kein Thread gewaehlt'}
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
                    : 'border-[var(--color-gray)]/15 bg-white/55'
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
                {message.sendError ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-[var(--color-error)]">Senden fehlgeschlagen.</span>
                    <button
                      type="button"
                      onClick={() => handleRetry(message)}
                      disabled={sending || !selectedUserKnown}
                      className="rounded border border-[var(--color-gray)]/25 px-2 py-1 font-semibold hover:border-[var(--color-accent)] disabled:opacity-60"
                    >
                      Retry
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveFailed(message.id)}
                      className="rounded border border-[var(--color-gray)]/25 px-2 py-1 font-semibold hover:border-[var(--color-error)]"
                    >
                      Entfernen
                    </button>
                  </div>
                ) : null}
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
            disabled={!selectedThreadId || !selectedUserKnown}
            className="ui-input min-w-0 flex-1 px-3 py-2 text-sm disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || !selectedThreadId || !selectedUserKnown || sending}
            className="ui-button ui-button-primary cursor-pointer px-4 py-2 text-sm font-semibold transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Senden
          </button>
        </form>
      </section>

      <aside className="ui-panel min-h-0 overflow-y-auto p-4">
        <div className="mb-4 border-b border-[var(--color-gray)]/15 pb-3">
          <h2 className="text-sm font-semibold">Kontext</h2>
          <p className="mt-1 text-xs text-[var(--color-gray)]">Matrix-Raum, Gruppe und Agent-Hinweise</p>
        </div>
        <div className="space-y-4">
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-gray)]">Gruppe</h3>
            <div className="ui-card-row p-3">
              <strong className="block text-sm">{selectedGroup?.name ?? 'Keine Gruppe'}</strong>
              <p className="mt-1 text-xs leading-5 text-[var(--color-gray)]">{selectedGroup?.description ?? 'Noch keine Beschreibung.'}</p>
            </div>
          </section>
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-gray)]">Status</h3>
            <div className="flex flex-wrap gap-2">
              <span className="ui-chip"><span className="ui-status-dot" /> Matrix verbunden</span>
              <span className="ui-chip">{groupThreads.length} Threads</span>
              <span className="ui-chip">{messages.length} Nachrichten</span>
            </div>
          </section>
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-gray)]">AI-Hinweise</h3>
            <div className="space-y-2 text-sm">
              <article className="ui-card-row p-3">
                <strong className="block">Zusammenfassung</strong>
                <span className="mt-1 block text-xs text-[var(--color-gray)]">Offene Entscheidungen und hohe Prioritaeten zuerst pruefen.</span>
              </article>
              <article className="ui-card-row p-3">
                <strong className="block">Prioritaet hoch</strong>
                <span className="mt-1 block text-xs text-[var(--color-gray)]">Nachrichten mit Favoriten-Filter im Fokus halten.</span>
              </article>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

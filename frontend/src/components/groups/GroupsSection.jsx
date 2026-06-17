import { useEffect, useMemo, useState } from 'react';
import {
  addGroupMember,
  fetchGroupDetails,
  fetchGroups,
  fetchMatrixUser,
  fetchMatrixRooms,
  formatTime,
  linkMatrixUser,
  linkMatrixRoom,
} from '../../services/api.js';

const ROLE_OPTIONS = ['member', 'owner'];

function mergeCollapsedGroups(currentGroups, nextGroups) {
  return nextGroups.map((group) => ({
    ...group,
    collapsed: currentGroups.find((item) => item.id === group.id)?.collapsed ?? false,
  }));
}

function formatChatHandle(value) {
  if (!value) return '';
  return value.replace(/^[@#!]/, '').split(':')[0] || value;
}

export default function GroupsSection({
  groups,
  setGroups,
  groupsLoadError,
  users,
  usersLoadError,
  selectedGroupId,
  onSelectGroup,
  selectedUserId,
  selectedUserKnown,
}) {
  const [rooms, setRooms] = useState([]);
  const [groupDetails, setGroupDetails] = useState(null);
  const [memberUserId, setMemberUserId] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [matrixUserUserId, setMatrixUserUserId] = useState('');
  const [matrixUserId, setMatrixUserId] = useState('');
  const [matrixUserLink, setMatrixUserLink] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [roomAlias, setRoomAlias] = useState('');
  const [roomPrimary, setRoomPrimary] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [savingMember, setSavingMember] = useState(false);
  const [savingMatrixUser, setSavingMatrixUser] = useState(false);
  const [savingRoom, setSavingRoom] = useState(false);
  const [formError, setFormError] = useState('');

  const selectedGroup = groups.find((group) => group.id === selectedGroupId);
  const selectedGroupKnown = Boolean(selectedGroup);

  const usersById = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setMemberUserId((current) => {
        if (users.some((user) => user.id === current)) return current;
        if (selectedUserKnown) return selectedUserId;
        return users[0]?.id ?? '';
      });
      setMatrixUserUserId((current) => {
        if (users.some((user) => user.id === current)) return current;
        if (selectedUserKnown) return selectedUserId;
        return users[0]?.id ?? '';
      });
    });
    return () => {
      cancelled = true;
    };
  }, [selectedUserId, selectedUserKnown, users]);

  useEffect(() => {
    let cancelled = false;
    if (!matrixUserUserId) {
      queueMicrotask(() => {
        if (!cancelled) setMatrixUserLink(null);
      });
      return () => {
        cancelled = true;
      };
    }

    fetchMatrixUser(matrixUserUserId)
      .then((link) => {
        if (cancelled) return;
        setMatrixUserLink(link);
        setMatrixUserId('');
      })
      .catch(() => {
        if (cancelled) return;
        setMatrixUserLink(null);
        setMatrixUserId('');
      });

    return () => {
      cancelled = true;
    };
  }, [matrixUserUserId]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedGroupId) {
      queueMicrotask(() => {
        if (cancelled) return;
        setGroupDetails(null);
        setRooms([]);
        setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }

    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    Promise.all([fetchGroupDetails(selectedGroupId), fetchMatrixRooms(selectedGroupId)])
      .then(([details, nextRooms]) => {
        if (cancelled) return;
        setGroupDetails(details);
        setRooms(nextRooms);
        setLoadError(false);
      })
      .catch(() => {
        if (cancelled) return;
        setGroupDetails(null);
        setRooms([]);
        setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedGroupId]);

  const refreshSelectedGroup = async () => {
    if (!selectedGroupId) return;
    const [details, nextRooms, nextGroups] = await Promise.all([
      fetchGroupDetails(selectedGroupId),
      fetchMatrixRooms(selectedGroupId),
      fetchGroups(),
    ]);
    setGroupDetails(details);
    setRooms(nextRooms);
    setGroups((current) => mergeCollapsedGroups(current, nextGroups));
    setLoadError(false);
  };

  const handleAddMember = async (event) => {
    event.preventDefault();
    if (!selectedGroupKnown || !memberUserId) return;
    setSavingMember(true);
    setFormError('');
    try {
      await addGroupMember(selectedGroupId, {
        userId: memberUserId,
        memberRole: memberRole || 'member',
      });
      await refreshSelectedGroup();
    } catch (error) {
      setFormError(error.message || 'Mitglied konnte nicht gespeichert werden.');
    } finally {
      setSavingMember(false);
    }
  };

  const handleLinkMatrixUser = async (event) => {
    event.preventDefault();
    const nextMatrixUserId = matrixUserId.trim();
    if (!matrixUserUserId || !nextMatrixUserId) return;
    setSavingMatrixUser(true);
    setFormError('');
    try {
      const link = await linkMatrixUser({
        userId: matrixUserUserId,
        matrixUserId: nextMatrixUserId,
      });
      setMatrixUserLink(link);
      setMatrixUserId('');
    } catch (error) {
      setFormError(error.message || 'Chat-User konnte nicht verlinkt werden.');
    } finally {
      setSavingMatrixUser(false);
    }
  };

  const handleLinkRoom = async (event) => {
    event.preventDefault();
    const matrixRoomId = roomId.trim();
    if (!selectedGroupKnown || !matrixRoomId) return;
    setSavingRoom(true);
    setFormError('');
    try {
      await linkMatrixRoom({
        groupId: selectedGroupId,
        matrixRoomId,
        roomAlias: roomAlias.trim() || null,
        isPrimary: roomPrimary,
      });
      await refreshSelectedGroup();
      setRoomId('');
      setRoomAlias('');
      setRoomPrimary(true);
    } catch (error) {
      setFormError(error.message || 'Chat-Raum konnte nicht verlinkt werden.');
    } finally {
      setSavingRoom(false);
    }
  };

  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[340px_1fr]">
      <section className="ui-panel min-h-0 overflow-y-auto p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Gruppen</h2>
            <p className="mt-1 text-xs text-[var(--color-gray)]">Personen, Rollen und Chat-Räume</p>
          </div>
          <span className="ui-chip">{groups.length}</span>
        </div>
        {groupsLoadError ? (
          <p className="text-sm text-[var(--color-error)]">Gruppen konnten nicht geladen werden.</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-[var(--color-gray)]">Keine Gruppen.</p>
        ) : (
          <div className="space-y-2">
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => onSelectGroup(group.id)}
                aria-current={group.id === selectedGroupId ? 'page' : undefined}
                className={`w-full rounded-[8px] border px-3 py-3 text-left text-sm transition-colors duration-150 ${
                  group.id === selectedGroupId
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                    : 'border-[var(--color-gray)]/15 hover:border-[var(--color-accent)]'
                }`}
              >
                <strong className="block">{group.name}</strong>
                <span className="mt-1 block text-xs text-[var(--color-gray)]">{group.description}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="ui-panel min-h-0 overflow-y-auto p-5">
        {loading ? (
          <p className="text-sm text-[var(--color-gray)]">Lade Gruppendaten...</p>
        ) : loadError ? (
          <p className="text-sm text-[var(--color-error)]">Gruppendetails konnten nicht geladen werden.</p>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-gray)]/15 pb-3">
              <div>
                <h2 className="text-lg font-semibold">{groupDetails?.name ?? selectedGroup?.name ?? 'Gruppe'}</h2>
                <p className="mt-1 text-sm text-[var(--color-gray)]">
                  {groupDetails?.description ?? selectedGroup?.description ?? ''}
                </p>
              </div>
              {selectedGroup?.createdAt ? (
                <span className="rounded border border-[var(--color-gray)]/20 px-2 py-1 text-xs text-[var(--color-gray)]">
                  {formatTime(selectedGroup.createdAt)}
                </span>
              ) : null}
            </div>

            {formError ? <p className="mb-3 text-sm text-[var(--color-error)]">{formError}</p> : null}

            <div className="grid gap-4 lg:grid-cols-2">
              <DetailBlock title="Mitglieder">
                {groupDetails?.members?.length ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {groupDetails.members.map((member) => (
                      <article key={member.userId} className="ui-card-row flex items-center gap-3 px-3 py-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]/12 text-xs font-bold text-[var(--color-accent)]">
                          {(usersById.get(member.userId)?.displayName ?? member.displayName ?? '?').slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <strong className="block truncate text-sm">
                            {usersById.get(member.userId)?.displayName ?? member.displayName}
                          </strong>
                          <span className="text-xs text-[var(--color-gray)]">{member.memberRole}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-gray)]">Keine Mitglieder.</p>
                )}

                <form className="mt-4 space-y-2 border-t border-[var(--color-gray)]/15 pt-3" onSubmit={handleAddMember}>
                  <select
                    aria-label="Mitglied auswählen"
                    value={memberUserId}
                    onChange={(event) => setMemberUserId(event.target.value)}
                    disabled={users.length === 0 || usersLoadError}
                    className="ui-input w-full px-3 py-2 text-sm disabled:opacity-60"
                  >
                    {users.length === 0 ? <option value="">Keine User</option> : null}
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.displayName}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <select
                      aria-label="Mitgliedsrolle"
                      value={memberRole}
                      onChange={(event) => setMemberRole(event.target.value)}
                      className="ui-input min-w-0 flex-1 px-3 py-2 text-sm"
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={!selectedGroupKnown || !memberUserId || savingMember}
                      className="ui-button ui-button-primary px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Hinzufügen
                    </button>
                  </div>
                </form>
              </DetailBlock>

              <DetailBlock title="Chat-User">
                {matrixUserLink ? (
                  <article className="ui-card-row mb-3 px-3 py-2">
                    <strong className="block text-sm">{formatChatHandle(matrixUserLink.matrixUserId)}</strong>
                    <span className="text-xs text-[var(--color-gray)]">
                      {matrixUserLink.linkStatus} / {formatTime(matrixUserLink.linkedAt)}
                    </span>
                  </article>
                ) : (
                  <p className="mb-3 text-sm text-[var(--color-gray)]">Kein Chat-User-Link für die Auswahl.</p>
                )}

                <form className="space-y-2 border-t border-[var(--color-gray)]/15 pt-3" onSubmit={handleLinkMatrixUser}>
                  <select
                    aria-label="User für Chat-Link auswählen"
                    value={matrixUserUserId}
                    onChange={(event) => setMatrixUserUserId(event.target.value)}
                    disabled={users.length === 0 || usersLoadError}
                    className="ui-input w-full px-3 py-2 text-sm disabled:opacity-60"
                  >
                    {users.length === 0 ? <option value="">Keine User</option> : null}
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.displayName}
                      </option>
                    ))}
                  </select>
                  <input
                    aria-label="Chat-User-ID"
                    value={matrixUserId}
                    onChange={(event) => setMatrixUserId(event.target.value)}
                    placeholder="@user:server.local"
                    className="ui-input w-full px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!matrixUserUserId || !matrixUserId.trim() || savingMatrixUser}
                    className="ui-button ui-button-primary px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    User verlinken
                  </button>
                </form>
              </DetailBlock>

              <DetailBlock title="Chat-Räume">
                {rooms.length ? (
                  <div className="space-y-2">
                    {rooms.map((room) => (
                      <article key={room.id} className="ui-card-row px-3 py-2">
                        <strong className="block text-sm">{formatChatHandle(room.roomAlias ?? room.matrixRoomId)}</strong>
                        <span className="text-xs text-[var(--color-gray)]">
                          {room.linkStatus}{room.isPrimary ? ' / primary' : ''}
                        </span>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-gray)]">Kein Chat-Raum.</p>
                )}

                <form className="mt-4 space-y-2 border-t border-[var(--color-gray)]/15 pt-3" onSubmit={handleLinkRoom}>
                  <input
                    aria-label="Chat-Raum-ID"
                    value={roomId}
                    onChange={(event) => setRoomId(event.target.value)}
                    placeholder="!raum:server.local"
                    className="ui-input w-full px-3 py-2 text-sm"
                  />
                  <input
                    aria-label="Chat-Raum-Alias"
                    value={roomAlias}
                    onChange={(event) => setRoomAlias(event.target.value)}
                    placeholder="#team:server.local"
                    className="ui-input w-full px-3 py-2 text-sm"
                  />
                  <label className="flex items-center gap-2 text-xs text-[var(--color-gray)]">
                    <input
                      type="checkbox"
                      checked={roomPrimary}
                      onChange={(event) => setRoomPrimary(event.target.checked)}
                    />
                    Primärer Raum
                  </label>
                  <button
                    type="submit"
                    disabled={!selectedGroupKnown || !roomId.trim() || savingRoom}
                    className="ui-button ui-button-primary px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Raum verlinken
                  </button>
                </form>
              </DetailBlock>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function DetailBlock({ title, children }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-gray)]">
        {title}
      </h3>
      {children}
    </div>
  );
}

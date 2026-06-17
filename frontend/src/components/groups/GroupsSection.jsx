import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_GROUP_ID,
  fetchGroupDetails,
  fetchGroups,
  fetchMatrixRooms,
  formatTime,
} from '../../services/api.js';

export default function GroupsSection() {
  const [groups, setGroups] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(DEFAULT_GROUP_ID);
  const [groupDetails, setGroupDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchGroups(), fetchMatrixRooms()])
      .then(([nextGroups, nextRooms]) => {
        if (cancelled) return;
        setGroups(nextGroups);
        setRooms(nextRooms);
        setLoadError(false);
        setSelectedGroupId((current) => (
          nextGroups.some((group) => group.id === current)
            ? current
            : nextGroups[0]?.id ?? DEFAULT_GROUP_ID
        ));
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
    if (!selectedGroupId) {
      return () => {
        cancelled = true;
      };
    }

    fetchGroupDetails(selectedGroupId)
      .then((details) => {
        if (!cancelled) setGroupDetails(details);
      })
      .catch(() => {
        if (!cancelled) setGroupDetails(null);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedGroupId]);

  const selectedGroup = groups.find((group) => group.id === selectedGroupId);
  const groupRooms = useMemo(
    () => rooms.filter((room) => room.groupId === selectedGroupId),
    [rooms, selectedGroupId],
  );

  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[360px_1fr]">
      <section className="min-h-0 rounded border border-[var(--color-gray)]/20 bg-[var(--color-content)] p-4">
        <h2 className="mb-3 text-sm font-semibold">Gruppen</h2>
        {loading ? (
          <p className="text-sm text-[var(--color-gray)]">Lade Gruppen...</p>
        ) : loadError ? (
          <p className="text-sm text-[var(--color-error)]">Gruppen konnten nicht geladen werden.</p>
        ) : (
          <div className="space-y-2">
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setSelectedGroupId(group.id)}
                className={`w-full rounded border px-3 py-3 text-left text-sm transition-colors duration-150 ${
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

      <section className="min-h-0 overflow-y-auto rounded border border-[var(--color-gray)]/20 bg-[var(--color-content)] p-5">
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

        <div className="grid gap-4 lg:grid-cols-2">
          <DetailBlock title="Mitglieder">
            {groupDetails?.members?.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {groupDetails.members.map((member) => (
                  <article key={member.userId} className="rounded border border-[var(--color-gray)]/15 px-3 py-2">
                    <strong className="block text-sm">{member.displayName}</strong>
                    <span className="text-xs text-[var(--color-gray)]">{member.memberRole}</span>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-gray)]">Keine Mitglieder.</p>
            )}
          </DetailBlock>

          <DetailBlock title="Matrix">
            {groupRooms.length ? (
              <div className="space-y-2">
                {groupRooms.map((room) => (
                  <article key={room.id} className="rounded border border-[var(--color-gray)]/15 px-3 py-2">
                    <strong className="block text-sm">{room.roomAlias ?? room.matrixRoomId}</strong>
                    <span className="text-xs text-[var(--color-gray)]">{room.linkStatus}</span>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-gray)]">Kein Matrix-Raum.</p>
            )}
          </DetailBlock>
        </div>
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

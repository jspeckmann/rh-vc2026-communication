INSERT INTO users_cache (id, display_name, role, source)
VALUES
    ('user-david', 'David', 'architect', 'dummy'),
    ('user-samira', 'Samira', 'backend', 'dummy'),
    ('user-leyla', 'Leyla', 'frontend', 'dummy')
ON CONFLICT (id) DO NOTHING;

INSERT INTO groups (id, name, description, created_by_user_id, created_at, updated_at)
VALUES
    ('group-team-1', 'Team 1 Kommunikation', 'Kommunikation, Wissen und Agent-Feed', 'user-david', '2026-06-17T09:00:00Z', '2026-06-17T09:00:00Z'),
    ('group-demo-support', 'Demo Support', 'Abstimmung für Demo, Readback und offene Gates', 'user-david', '2026-06-17T09:05:00Z', '2026-06-17T09:05:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO group_members (group_id, user_id, member_role, joined_at)
VALUES
    ('group-team-1', 'user-david', 'owner', '2026-06-17T09:15:00Z'),
    ('group-team-1', 'user-samira', 'member', '2026-06-17T09:15:00Z'),
    ('group-demo-support', 'user-david', 'owner', '2026-06-17T09:15:00Z'),
    ('group-demo-support', 'user-leyla', 'member', '2026-06-17T09:15:00Z')
ON CONFLICT (group_id, user_id) DO NOTHING;

INSERT INTO matrix_user_links (id, user_id, matrix_user_id, link_status, linked_at)
VALUES
    ('mul-1', 'user-david', '@david:matrix.local', 'linked', '2026-06-17T09:12:00Z'),
    ('mul-2', 'user-samira', '@samira:matrix.local', 'linked', '2026-06-17T09:13:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO matrix_room_links (id, group_id, matrix_room_id, room_alias, is_primary, link_status, created_at)
VALUES
    ('mrl-1', 'group-team-1', '!team1:matrix.local', '#team-1-kommunikation:matrix.local', true, 'linked', '2026-06-17T09:10:00Z'),
    ('mrl-2', 'group-demo-support', '!demo-support:matrix.local', '#team-1-demo-support:matrix.local', true, 'linked', '2026-06-17T09:11:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO threads (id, group_id, title, type, created_by_user_id, status, created_at, updated_at)
VALUES
    ('thread-architecture', 'group-team-1', 'DB-Entscheidung', 'decision', 'user-david', 'open', '2026-06-17T09:20:00Z', '2026-06-17T09:20:00Z'),
    ('thread-matrix-link', 'group-team-1', 'Chat-Verknüpfung klären', 'question', 'user-samira', 'open', '2026-06-17T09:30:00Z', '2026-06-17T09:30:00Z'),
    ('thread-demo-flow', 'group-demo-support', 'Demo-Readback vorbereiten', 'discussion', 'user-leyla', 'open', '2026-06-17T09:35:00Z', '2026-06-17T09:35:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO messages_cache (id, thread_id, matrix_room_id, matrix_event_id, author_user_id, body, priority_label, priority_score, sync_status, created_at)
VALUES
    ('msg-1', 'thread-architecture', '!team1:matrix.local', '$event1', 'user-david', 'PostgreSQL bleibt Modul-Wahrheit, der Chat bleibt der Austausch-Layer.', 'high', 0.91, 'cached', '2026-06-17T09:25:00Z'),
    ('msg-2', 'thread-matrix-link', '!team1:matrix.local', '$event2', 'user-samira', 'Für Submit zuerst vorhandene oder Demo-Räume verlinken.', 'normal', 0.66, 'cached', '2026-06-17T09:36:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO matrix_event_links (id, matrix_room_link_id, matrix_event_id, source_type, source_id, created_at)
VALUES
    ('mel-1', 'mrl-1', '$event1', 'message_cache', 'msg-1', '2026-06-17T09:25:00Z'),
    ('mel-2', 'mrl-1', '$event2', 'message_cache', 'msg-2', '2026-06-17T09:36:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO wiki_articles (id, group_id, title, body, tags, author_user_id, status, created_at, updated_at)
VALUES
    ('wiki-db-plan', 'group-team-1', 'DB-Plan Kommunikation', 'PostgreSQL speichert Gruppen, Wiki, Feed, Graph und Agent-Feedback.', ARRAY['db', 'chat', 'agent'], 'user-david', 'published', '2026-06-17T10:00:00Z', '2026-06-17T10:00:00Z'),
    ('wiki-matrix-postgres', 'group-team-1', 'Chat und PostgreSQL', 'Der Chat ist Austausch-Layer. PostgreSQL bleibt Modul-Wahrheit.', ARRAY['chat', 'postgresql'], 'user-samira', 'published', '2026-06-17T10:05:00Z', '2026-06-17T10:05:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO feed_items (id, group_id, source_type, source_id, title, summary, priority, created_at)
VALUES
    ('feed-1', 'group-team-1', 'agent_feed_item', 'agent-1', 'Wichtige DB-Entscheidung', 'PostgreSQL ist Modul-Wahrheit, der Chat bleibt der Austausch-Layer.', 'high', '2026-06-17T10:12:00Z'),
    ('feed-2', 'group-team-1', 'wiki_article', 'wiki-matrix-postgres', 'Chat-Linking dokumentiert', 'User- und Raum-Links bleiben getrennt vom Profil.', 'normal', '2026-06-17T10:13:00Z'),
    ('feed-3', 'group-demo-support', 'thread', 'thread-demo-flow', 'Demo-Readback offen', 'Lokale Checks sind Pflicht, Docker bleibt partial ohne Runtime.', 'normal', '2026-06-17T10:14:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO knowledge_nodes (id, type, title, summary, source_type, source_id)
VALUES
    ('node-user-david', 'person', 'David', 'Architektur', 'user', 'user-david'),
    ('node-user-samira', 'person', 'Samira', 'Backend', 'user', 'user-samira'),
    ('node-group-team-1', 'group', 'Team 1 Kommunikation', 'Gruppe für Kommunikation und Wissen', 'group', 'group-team-1'),
    ('node-thread-architecture', 'decision', 'DB-Entscheidung', 'PostgreSQL bleibt Modul-Wahrheit', 'thread', 'thread-architecture'),
    ('node-wiki-matrix-postgres', 'wiki_article', 'Chat und PostgreSQL', 'Trennung Austausch-Layer und Modul-Wahrheit', 'wiki_article', 'wiki-matrix-postgres'),
    ('node-agent-1', 'agent_item', 'Nächste Schritte DB-Integration', 'Assistenz erzeugt Taskliste', 'agent_feed_item', 'agent-1')
ON CONFLICT (id) DO NOTHING;

INSERT INTO knowledge_edges (id, from_node_id, to_node_id, relation, confidence, source_type, source_id)
VALUES
    ('edge-1', 'node-user-david', 'node-group-team-1', 'member_of', 1.0, 'group_member', 'group-team-1'),
    ('edge-2', 'node-user-samira', 'node-group-team-1', 'member_of', 1.0, 'group_member', 'group-team-1'),
    ('edge-3', 'node-group-team-1', 'node-thread-architecture', 'discussed_in', 1.0, 'thread', 'thread-architecture'),
    ('edge-4', 'node-thread-architecture', 'node-wiki-matrix-postgres', 'references', 1.0, 'wiki_article', 'wiki-matrix-postgres'),
    ('edge-5', 'node-agent-1', 'node-thread-architecture', 'related_to', 1.0, 'agent_feed_item', 'agent-1')
ON CONFLICT (id) DO NOTHING;

INSERT INTO agent_feed_items (id, group_id, item_type, title, content, source_type, source_id, priority, confidence, status, created_at)
VALUES
    ('agent-1', 'group-team-1', 'task_list', 'Nächste Schritte DB-Integration', '{"tasks":["PostgreSQL-Service vorbereiten","Schema initialisieren","Chat-Raum-Link testen"]}', 'thread', 'thread-architecture', 'high', 0.84, 'new', '2026-06-17T10:20:00Z'),
    ('agent-2', 'group-team-1', 'message_priority', 'Priorität: Chat-Event-Links', '{"priority":"high","reason":"Feed, Graph und Agent brauchen stabile Event-Referenzen."}', 'message_cache', 'msg-1', 'high', 0.78, 'new', '2026-06-17T10:21:00Z'),
    ('agent-3', 'group-demo-support', 'summary', 'Readback-Zusammenfassung', '{"summary":"Health, Useradapter, OpenAPI und Demo-Daten lokal prüfen; Docker/Synapse bleiben externe Gates."}', 'thread', 'thread-demo-flow', 'normal', 0.72, 'seen', '2026-06-17T10:22:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO agent_feedback (id, agent_feed_item_id, user_id, value, reason, created_at)
VALUES
    ('feedback-1', 'agent-1', 'user-david', 1, 'Hilft für die nächste Umsetzung.', '2026-06-17T10:25:00Z'),
    ('feedback-2', 'agent-2', 'user-samira', 1, 'Priorisierung ist nachvollziehbar.', '2026-06-17T10:26:00Z')
ON CONFLICT (id) DO NOTHING;

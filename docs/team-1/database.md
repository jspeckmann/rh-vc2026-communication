# Team 1 DB-Plan: Kommunikation

Stand: 2026-06-17

## Kurzentscheidung

Team 1 nutzt PostgreSQL als eigene Modul-Datenbank. Matrix/Synapse ist Pflicht
fuer Chat, aber nicht die alleinige Datenwahrheit.

Entscheidung:

- PostgreSQL speichert Gruppen, Mitglieder, Threads, Wiki, Feed, Knowledge
  Graph, Agent-Feed, Agent-Feedback und Matrix-Links.
- Matrix speichert Chat-Raeume, Matrix-User und rohe Matrix-Events.
- `messages_cache` speichert nur app-relevante Nachrichten oder Referenzen,
  nicht den kompletten Matrix-Verlauf.
- `matrix_event_links` kommt ins Submit-Schema, damit Feed, Graph und Agent
  sauber auf Matrix-Events zeigen koennen.
- Der Agent erzeugt keine "Vorschlaege zum Annehmen". Er hat einen eigenen
  Agent-Feed. Dort kann er Elemente wie Task-Listen, Priorisierungen,
  Zusammenfassungen, Risiken oder naechste Schritte erzeugen.
- Teammitglieder geben Agent-Feed-Elementen Feedback mit Daumen hoch/runter.

Einfach gesagt: Matrix macht Chat. PostgreSQL macht die OpenBoard-Wahrheit.

Die Umsetzungsreihenfolge steht in `docs/team-1/roadmap.md`. Die
Submit-Pruefung steht in `docs/team-1/evals.md`.

## Was Gehoert Wohin?

### Nur beziehungsweise hauptsaechlich in Matrix

- Matrix-User-ID
- Matrix-Raum-ID
- rohe Matrix-Nachrichten und Matrix-Events
- Matrix-interne Raum-/Membership-Daten

Das Modul darf diese Daten lesen oder referenzieren, soll aber nicht versuchen,
Matrix vollstaendig nachzubauen.

### In PostgreSQL

- Dummy-User beziehungsweise spaeter User-Cache
- Mapping `userId -> matrixUserId`
- Gruppen und Gruppenmitglieder
- Mapping `groupId -> matrixRoomId`
- Threads, Fragen und Entscheidungen
- app-relevante Nachrichten-Referenzen in `messages_cache`
- Feed-Eintraege
- Wiki-/Knowledge-Base-Artikel
- Knowledge-Graph-Nodes und -Edges
- Agent-Feed-Elemente
- Agent-Feedback
- Links von Matrix-Events auf Modulobjekte

### Beim Usermodul

Das Usermodul bleibt Profil-Wahrheit. Unser Modul speichert nur genug, um lokal
testen und Matrix verknuepfen zu koennen.

## Mindesttabellen Fuer Submit

### `users_cache`

Zweck: Dummy-User jetzt, spaeter Cache vom echten Usermodul.

Mindestfelder:

- `id`
- `display_name`
- `role`
- `source`: `dummy` oder `user_module`
- `external_user_id`
- `updated_at`

### `matrix_user_links`

Zweck: verbindet OpenBoard-User mit Matrix-Usern.

Mindestfelder:

- `id`
- `user_id`
- `matrix_user_id`
- `link_status`
- `linked_at`

Regel: `user_id` kommt aus `users_cache`, das Profil selbst kommt spaeter aus
dem Usermodul.

### `groups`

Zweck: fachliche Gruppen im Kommunikationsmodul.

Mindestfelder:

- `id`
- `name`
- `description`
- `created_by_user_id`
- `created_at`
- `updated_at`

### `group_members`

Zweck: Mitgliedschaften in Gruppen.

Mindestfelder:

- `group_id`
- `user_id`
- `member_role`
- `joined_at`

Empfehlung: `group_id` + `user_id` zusammen eindeutig machen.

### `matrix_room_links`

Zweck: verbindet Gruppe mit Matrix-Raum.

Mindestfelder:

- `id`
- `group_id`
- `matrix_room_id`
- `room_alias`
- `is_primary`
- `link_status`
- `created_at`

Submit-Empfehlung: Eine Gruppe hat genau einen primaeren Matrix-Raum. Mehrere
Raeume pro Gruppe koennen spaeter ergaenzt werden.

### `threads`

Zweck: Diskussionen, Fragen und Entscheidungen.

Mindestfelder:

- `id`
- `group_id`
- `title`
- `type`: `discussion`, `question`, `decision`
- `created_by_user_id`
- `status`
- `created_at`
- `updated_at`

### `messages_cache`

Zweck: app-relevante Nachrichten aus Matrix referenzieren oder fuer Feed/Agent
kurz zwischenspeichern.

Mindestfelder:

- `id`
- `thread_id`
- `matrix_room_id`
- `matrix_event_id`
- `author_user_id`
- `body`
- `priority_label`
- `priority_score`
- `sync_status`
- `created_at`

Regel: Kein Vollarchiv aller Matrix-Nachrichten. Nur relevante Nachrichten, die
im Feed, Thread, Graph oder Agent-Feed gebraucht werden.

### `matrix_event_links`

Zweck: Matrix-Events mit Modulobjekten verbinden.

Mindestfelder:

- `id`
- `matrix_room_link_id`
- `matrix_event_id`
- `source_type`: zum Beispiel `message_cache`, `feed_item`, `thread`
- `source_id`
- `created_at`

Regel: `matrix_room_link_id` + `matrix_event_id` sollte eindeutig sein.

### `wiki_articles`

Zweck: Knowledge Base.

Mindestfelder:

- `id`
- `group_id`
- `title`
- `body`
- `tags`
- `author_user_id`
- `status`
- `created_at`
- `updated_at`

### `feed_items`

Zweck: sichtbarer Gruppenfeed.

Mindestfelder:

- `id`
- `group_id`
- `source_type`: `matrix_message`, `thread`, `wiki_article`,
  `agent_feed_item`
- `source_id`
- `title`
- `summary`
- `priority`
- `created_at`

### `knowledge_nodes`

Zweck: Punkte im Knowledge Graph.

Mindestfelder:

- `id`
- `type`: `person`, `group`, `topic`, `decision`, `wiki_article`, `thread`,
  `agent_item`
- `title`
- `summary`
- `source_type`
- `source_id`
- `metadata`
- `created_at`

### `knowledge_edges`

Zweck: Beziehungen im Knowledge Graph.

Mindestfelder:

- `id`
- `from_node_id`
- `to_node_id`
- `relation`: `member_of`, `discussed_in`, `decided_by`, `references`,
  `owns`, `related_to`, `created_by_agent`
- `confidence`
- `source_type`
- `source_id`
- `created_at`

### `agent_feed_items`

Zweck: eigener Feed des LLM-Agenten.

Mindestfelder:

- `id`
- `group_id`
- `item_type`: `summary`, `task_list`, `message_priority`, `decision_digest`,
  `wiki_seed`, `risk`, `next_steps`
- `title`
- `content`
- `source_type`
- `source_id`
- `priority`
- `confidence`
- `status`: `new`, `seen`, `archived`
- `created_at`

Wichtig: `content` kann JSON sein. Damit passen Task-Listen, priorisierte
Nachrichten oder naechste Schritte in dieselbe Tabelle, ohne sofort viele
Sondertabellen zu bauen.

Scope-Grenze: Eine Agent-Task-Liste ist zuerst nur ein Element im
Kommunikationsmodul. Sie ist noch keine echte Aufgabe im Planungsmodul, solange
Team 4 dafuer keinen Integrationsvertrag liefert.

### `agent_feedback`

Zweck: Daumen hoch/runter auf Agent-Feed-Elemente.

Mindestfelder:

- `id`
- `agent_feed_item_id`
- `user_id`
- `value`: `1` fuer Daumen hoch, `-1` fuer Daumen runter
- `reason`
- `created_at`

Empfehlung: Pro User und Agent-Feed-Item nur ein aktuelles Feedback zaehlen.
Historie ist optional.

## Knowledge-Graph-Speisung

Der Knowledge Graph soll aus vorhandenen Modulobjekten entstehen:

- User aus `users_cache` werden `person`-Nodes.
- Gruppen aus `groups` werden `group`-Nodes.
- Wiki-Artikel aus `wiki_articles` werden `wiki_article`-Nodes.
- Threads mit Typ `decision` werden `decision`-Nodes.
- Wichtige Threads werden `thread`-Nodes.
- Agent-Feed-Elemente koennen `agent_item`-Nodes werden, wenn sie relevant sind.

Beispiele fuer Edges:

- Person `member_of` Gruppe
- Gruppe `discussed_in` Thread
- Entscheidung `decided_by` Gruppe
- Wiki-Artikel `references` Thema oder Entscheidung
- Agent-Feed-Element `related_to` Nachricht, Thread oder Wiki-Artikel

Empfehlung: Fuer den Hackathon duerfen Graph-Nodes und Edges beim Erstellen
wichtiger Objekte direkt erzeugt werden. Ein spaeterer `rebuild`-Job ist nett,
aber nicht Pflicht fuer Submit.

## Seed-Daten

Beim Start sollten Testdaten angelegt werden, damit Demo und UI nicht leer sind:

- mindestens 3 Dummy-User
- mindestens 2 Gruppen
- pro Gruppe ein Matrix-Room-Link als Dummy oder echter Link
- mindestens 1 Diskussion, 1 Frage, 1 Entscheidung
- mindestens 2 Wiki-Artikel mit Tags
- mindestens 3 Feed-Eintraege
- mindestens 5 Knowledge-Nodes und 5 Knowledge-Edges
- mindestens 3 Agent-Feed-Items: Task-Liste, Message-Priorisierung,
  Zusammenfassung oder naechste Schritte
- mindestens 2 Agent-Feedback-Beispiele

## Init- Und Migrationsstrategie

Aktueller Stand:

- Schema liegt in `migrations/202606170001_team1_kommunikation.sql`.
- Demo-Seed liegt in `migrations/202606170002_demo_seed.sql`.
- `src/db.rs` enthaelt SQLx-Queries fuer Users, Groups, Threads, Messages,
  Wiki, Feed, Knowledge Graph, Agent-Feed, Feedback und Matrix-Links.
- Der Axum-Service nutzt PostgreSQL, sobald `DATABASE_URL` gesetzt ist. Ohne
  `DATABASE_URL` startet er mit Mock-State, damit lokale API- und
  Frontend-Integration auch ohne DB lauffaehig bleibt.

Hackathon-Empfehlung fuer Runtime:

- Fuer den Submit reicht eine einfache, idempotente Initialisierung:
  Schema anlegen, falls es fehlt, danach Seed-Daten einfuegen, falls leer.
- Wenn Rust/Axum gebaut wird: SQLx-Migrationen plus Seed-Funktion bevorzugen.
- Wenn Postgres direkt initialisiert wird: `schema.sql` und `seed.sql` nutzen.
- Kein ORM-Zwang: sichtbare SQL-Queries sind fuer dieses Modul gut
  nachvollziehbar.

Informatiker-Check: Bitte pruefen, welche Variante am besten zum finalen
Repo-Stack passt. Wichtig ist nicht Perfektion, sondern reproduzierbarer Start.

## ENV-Variablen

Keine echten Secrets ins Repo schreiben. In `.env.example` nur Platzhalter.

Empfohlene Variablen:

- `DATABASE_URL`
- `POSTGRES_PASSWORD`
- `APP_HOST`
- `PORT`
- `MATRIX_HOMESERVER_URL`
- `MATRIX_ACCESS_TOKEN`
- `AUTH_JWT_ISSUER`
- `AUTH_JWT_AUDIENCE`
- `USER_MODULE_BASE_URL`
- `LLM_PROVIDER`
- `LLM_API_KEY`
- `LLM_MOCK_MODE`

## Submit-Gates

Vor Submit muss wirklich laufen:

- PostgreSQL-Service startet.
- Schema wird angelegt.
- Seed-Daten sind vorhanden.
- API kann Gruppen, Wiki, Feed, Knowledge Graph und Agent-Feed aus PostgreSQL
  lesen.
- Matrix/Synapse laeuft als eigener Docker-Service oder ist im Compose klar
  enthalten und verlinkbar.
- User-Link und Room-Link funktionieren ueber API.
- Agent-Feed kann mit echtem LLM-Key oder Mock/Fallback erzeugt werden.
- Daumen hoch/runter Feedback wird gespeichert.
- `GET /api/chat/knowledge/graph` liefert Nodes und Edges.
- `GET /api/chat/dashboard` zeigt DB, Matrix, Knowledge Graph und Agent-Feed in
  einem nutzbaren Gesamtbild.

Darf als vorbereitete Integration dokumentiert sein:

- echter Usermodul-Endpoint, solange Dummy-Adapter funktioniert
- finale Authentik/JWT-Rollen, solange Platzhalter klar sind
- echte Team-4-Task-Integration, solange Agent-Task-Listen im Agent-Feed bleiben
- komplexer Matrix-Vollsync
- komplexe Volltextsuche

## Offene Fragen Fuer Gegencheck

Diese Fragen sind nicht mehr blockierend fuer die Architektur, sollten aber vor
Submit mit Backend/DevOps beziehungsweise den anderen Teams gegengeprueft
werden:

- Nutzt das finale Repo SQLx-Migrationen oder direkt `schema.sql`/`seed.sql`?
- Wird Synapse lokal mit echter Registrierung gestartet oder mit vorbereiteten
  Demo-Usern/Raeumen?
- Legt unser Modul Matrix-Raeume selbst an oder verlinkt es nur bereits
  vorhandene Raeume?
- Wie heisst der echte User-Endpunkt von Team 5, und welches Feld ist die
  stabile User-ID?
- Welche JWT-Felder liefern Team 3/5 fuer `userId`, Rollen und Admin-Rechte?
- Soll Team 4 spaeter Agent-Task-Listen importieren, oder bleiben sie nur im
  Kommunikationsmodul sichtbar?
- Welche LLM-ENV-Namen will das Team einheitlich nutzen?
- Reicht `API.md` fuer Submit, oder muss `/openapi.json` zwingend erreichbar
  sein?

## Risiken

- Synapse kann fuer Hackathon-Setup schwerer sein als die API selbst.
- Matrix-Vollsync ist Scope-Risiko; deshalb nur relevante Events cachen.
- Agent-Task-Listen duerfen nicht heimlich Team 4 ersetzen.
- Ohne Usermodul muss der Dummy-Adapter sauber und austauschbar bleiben.
- Ohne echten LLM-Key muss Mock/Fallback trotzdem pruefbar sein.
- Authentik/JWT darf nicht selbst gebaut werden, solange Team 3/5 noch nicht
  final geliefert hat.

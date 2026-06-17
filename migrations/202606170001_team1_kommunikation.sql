CREATE TABLE IF NOT EXISTS users_cache (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('dummy', 'user_module')),
    external_user_id TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS matrix_user_links (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users_cache(id) ON DELETE CASCADE,
    matrix_user_id TEXT NOT NULL,
    link_status TEXT NOT NULL DEFAULT 'linked',
    linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id),
    UNIQUE (matrix_user_id)
);

CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_by_user_id TEXT NOT NULL REFERENCES users_cache(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_members (
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users_cache(id) ON DELETE CASCADE,
    member_role TEXT NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS matrix_room_links (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    matrix_room_id TEXT NOT NULL,
    room_alias TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    link_status TEXT NOT NULL DEFAULT 'linked',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_matrix_room_links_primary
    ON matrix_room_links(group_id)
    WHERE is_primary;

CREATE TABLE IF NOT EXISTS threads (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('discussion', 'question', 'decision')),
    created_by_user_id TEXT NOT NULL REFERENCES users_cache(id),
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages_cache (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    matrix_room_id TEXT,
    matrix_event_id TEXT,
    author_user_id TEXT NOT NULL REFERENCES users_cache(id),
    body TEXT NOT NULL,
    priority_label TEXT NOT NULL DEFAULT 'normal',
    priority_score REAL NOT NULL DEFAULT 0.5,
    sync_status TEXT NOT NULL DEFAULT 'cached',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS matrix_event_links (
    id TEXT PRIMARY KEY,
    matrix_room_link_id TEXT NOT NULL REFERENCES matrix_room_links(id) ON DELETE CASCADE,
    matrix_event_id TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (matrix_room_link_id, matrix_event_id)
);

CREATE TABLE IF NOT EXISTS wiki_articles (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    author_user_id TEXT NOT NULL REFERENCES users_cache(id),
    status TEXT NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feed_items (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_nodes (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_edges (
    id TEXT PRIMARY KEY,
    from_node_id TEXT NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    to_node_id TEXT NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    relation TEXT NOT NULL,
    confidence REAL NOT NULL DEFAULT 1.0,
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_feed_items (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal',
    confidence REAL NOT NULL DEFAULT 0.0,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_feedback (
    id TEXT PRIMARY KEY,
    agent_feed_item_id TEXT NOT NULL REFERENCES agent_feed_items(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users_cache(id) ON DELETE CASCADE,
    value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_threads_group_id ON threads(group_id);
CREATE INDEX IF NOT EXISTS idx_wiki_articles_group_id ON wiki_articles(group_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_group_id ON feed_items(group_id);
CREATE INDEX IF NOT EXISTS idx_agent_feed_items_group_id ON agent_feed_items(group_id);

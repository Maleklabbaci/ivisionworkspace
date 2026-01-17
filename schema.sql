
-- Schéma de base iVISION
-- Se référer à supabase_setup.sql pour les politiques RLS complexes.

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name TEXT,
    email TEXT,
    role TEXT,
    permissions JSONB
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY,
    title TEXT,
    status TEXT,
    assignee_id UUID
);

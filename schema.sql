
-- TABLE: USERS (Profils étendus connectés à Auth Supabase)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar TEXT,
    role TEXT DEFAULT 'Membre',
    phone_number TEXT,
    notification_pref TEXT DEFAULT 'all',
    status TEXT DEFAULT 'active',
    permissions JSONB DEFAULT '{}'::jsonb,
    ai_api_key TEXT,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: CLIENTS (Le CRM principal)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: LEADS (Prospection et Acquisition)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'lost'
    source TEXT,
    value_min NUMERIC DEFAULT 0,
    value_max NUMERIC DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: TASKS (Gestion des Missions)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'À faire', -- 'À faire', 'En cours', 'Bloqué', 'Terminé'
    due_date DATE,
    priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
    type TEXT DEFAULT 'content', -- 'content', 'ads', 'social', 'seo', 'admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: CHANNELS (Canaux de communication)
CREATE TABLE IF NOT EXISTS public.channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'project', -- 'global', 'project'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: MESSAGES (Chat interne)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachments TEXT[], -- Tableau d'URLs de fichiers
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: FILE_LINKS (Documents et Assets)
CREATE TABLE IF NOT EXISTS public.file_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: CONFIGS (Pour la vérification de connexion du client)
CREATE TABLE IF NOT EXISTS public.configs (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- INITIALISATION DATA (Exemple de canal global)
INSERT INTO public.channels (name, type) VALUES ('Général', 'global') ON CONFLICT DO NOTHING;

-- ROW LEVEL SECURITY (RLS)
-- Activez la sécurité sur toutes les tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_links ENABLE ROW LEVEL SECURITY;

-- POLITIQUES PAR DÉFAUT (Accès complet aux utilisateurs authentifiés pour l'instant)
-- Note : En production, affinez ces politiques selon le rôle (Admin vs Membre)
CREATE POLICY "Allow all for authenticated users" ON public.users FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.clients FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.leads FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.tasks FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.channels FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.messages FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.file_links FOR ALL TO authenticated USING (true);

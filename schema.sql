
-- iVISION AGENCY FULL SYSTEM SCHEMA v4.1
-- Architecture synchronisée pour la gestion automatisée des membres et des permissions.

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ 
BEGIN
    -- 1. TABLE: USERS (Table de profil public synchronisée avec Auth)
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        CREATE TABLE public.users (
            id UUID PRIMARY KEY, -- Référence à auth.users.id
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            avatar TEXT,
            role TEXT DEFAULT 'Membre' CHECK (role IN ('Admin', 'Membre', 'Chef de Projet', 'Community Manager', 'Analyste Marketing')),
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
            permissions JSONB DEFAULT '{}'::jsonb,
            phone_number TEXT,
            notification_pref TEXT DEFAULT 'all',
            last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            ai_api_key TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        -- S'assurer que les contraintes de rôle sont à jour
        ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
        ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('Admin', 'Membre', 'Chef de Projet', 'Community Manager', 'Analyste Marketing'));
    END IF;

    -- 2. TABLE: CLIENTS (CRM Core)
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clients') THEN
        CREATE TABLE public.clients (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            company TEXT,
            email TEXT,
            phone TEXT,
            address TEXT,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- 3. TABLE: PROJECTS (Management des Budgets)
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'projects') THEN
        CREATE TABLE public.projects (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            total_budget NUMERIC DEFAULT 0,
            spent_budget NUMERIC DEFAULT 0,
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
            client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- 4. TABLE: TASKS (Missions Opérationnelles)
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tasks') THEN
        CREATE TABLE public.tasks (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            assignee_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
            client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
            project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
            due_date TEXT,
            status TEXT DEFAULT 'À faire',
            type TEXT DEFAULT 'content',
            priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
            attachments TEXT[] DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- 5. TABLE: CHANNELS (Structure Chat)
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'channels') THEN
        CREATE TABLE public.channels (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT DEFAULT 'global',
            created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
            member_ids UUID[] DEFAULT '{}',
            is_private BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- 6. TABLE: MESSAGES (Communications Flux)
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
        CREATE TABLE public.messages (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
            channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            attachments TEXT[] DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- 7. TABLE: LEADS (Pipeline Prospect)
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leads') THEN
        CREATE TABLE public.leads (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            company TEXT,
            email TEXT,
            phone TEXT,
            status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'lost')),
            source TEXT,
            value_min NUMERIC DEFAULT 0,
            value_max NUMERIC DEFAULT 0,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        -- Migration check for 'source' column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='source') THEN
            ALTER TABLE public.leads ADD COLUMN source TEXT;
        END IF;
    END IF;

    -- 8. TABLE: SALARIES (Finance RH)
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'salaries') THEN
        CREATE TABLE public.salaries (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
            amount NUMERIC NOT NULL DEFAULT 0,
            bonus NUMERIC DEFAULT 0,
            frequency TEXT DEFAULT 'mensuel' CHECK (frequency IN ('hebdo', 'mensuel')),
            status TEXT DEFAULT 'pending' CHECK (status IN ('paid', 'pending')),
            last_paid_date TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- 9. TABLE: EXPENSES (Frais Généraux)
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'expenses') THEN
        CREATE TABLE public.expenses (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            amount NUMERIC NOT NULL DEFAULT 0,
            type TEXT DEFAULT 'other',
            project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
            status TEXT DEFAULT 'pending' CHECK (status IN ('paid', 'pending')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- 10. TABLE: AD_CAMPAIGNS (Budgets Marketing)
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ad_campaigns') THEN
        CREATE TABLE public.ad_campaigns (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            amount NUMERIC NOT NULL DEFAULT 0,
            platform TEXT DEFAULT 'facebook',
            project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- 11. TABLE: FILE_LINKS (Asset Storage)
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'file_links') THEN
        CREATE TABLE public.file_links (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
            created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

END $$;

-- 12. REALTIME PUBLICATION
-- Configuration du flux temps réel pour toutes les tables critiques.
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.users, 
    public.tasks, 
    public.leads, 
    public.clients, 
    public.messages, 
    public.channels, 
    public.projects, 
    public.salaries,
    public.expenses,
    public.ad_campaigns,
    public.file_links;

-- 13. COMMENTAIRE DE VERSION
COMMENT ON SCHEMA public IS 'iVISION Core Schema v4.1 - Defensive Column Check';
NOTIFY pgrst, 'reload schema';

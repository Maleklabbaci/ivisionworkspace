
-- iVISION AGENCY FULL SYSTEM SCHEMA v3.0
-- This script creates all necessary tables and ensures columns are synchronized.

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ 
BEGIN
    -- 1. TABLE: USERS
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        CREATE TABLE public.users (
            id UUID PRIMARY KEY, -- Linked to Supabase Auth
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            avatar TEXT,
            role TEXT DEFAULT 'Membre',
            status TEXT DEFAULT 'active',
            permissions JSONB DEFAULT '{}'::jsonb,
            phone_number TEXT,
            notification_pref TEXT DEFAULT 'all',
            last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            ai_api_key TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- 2. TABLE: CLIENTS
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

    -- 3. TABLE: PROJECTS (ACTIVITÉS)
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'projects') THEN
        CREATE TABLE public.projects (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            total_budget NUMERIC DEFAULT 0,
            spent_budget NUMERIC DEFAULT 0,
            status TEXT DEFAULT 'active',
            client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- 4. TABLE: TASKS (MISSIONS)
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
            priority TEXT DEFAULT 'medium',
            attachments TEXT[] DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        -- Ensure project_id exists if table was created earlier
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='project_id') THEN
            ALTER TABLE public.tasks ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
        END IF;
    END IF;

    -- 5. TABLE: CHANNELS
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

    -- 6. TABLE: MESSAGES
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

    -- 7. TABLE: LEADS
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leads') THEN
        CREATE TABLE public.leads (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            company TEXT,
            email TEXT,
            phone TEXT,
            status TEXT DEFAULT 'new',
            source TEXT,
            value_min NUMERIC DEFAULT 0,
            value_max NUMERIC DEFAULT 0,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- 8. TABLE: SALARIES (FINANCE - VOLET RH)
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'salaries') THEN
        CREATE TABLE public.salaries (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
            amount NUMERIC NOT NULL DEFAULT 0,
            bonus NUMERIC DEFAULT 0,
            frequency TEXT DEFAULT 'mensuel',
            status TEXT DEFAULT 'pending',
            last_paid_date TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        -- Ensure project_id and bonus exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='salaries' AND column_name='project_id') THEN
            ALTER TABLE public.salaries ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='salaries' AND column_name='bonus') THEN
            ALTER TABLE public.salaries ADD COLUMN bonus NUMERIC DEFAULT 0;
        END IF;
    END IF;

    -- 9. TABLE: EXPENSES (FINANCE - VOLET FRAIS OPÉRATIONNELS)
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'expenses') THEN
        CREATE TABLE public.expenses (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            amount NUMERIC NOT NULL DEFAULT 0,
            type TEXT DEFAULT 'other', -- travel, freelance, software, office, other
            project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- 10. TABLE: AD_CAMPAIGNS (FINANCE - VOLET ADS)
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ad_campaigns') THEN
        CREATE TABLE public.ad_campaigns (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            amount NUMERIC NOT NULL DEFAULT 0,
            platform TEXT DEFAULT 'facebook', -- facebook, google, tiktok, instagram, other
            project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- 11. TABLE: FILE_LINKS
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
-- Recreate publication to include all new tables
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

-- 13. FORCE POSTGREST SCHEMA RELOAD
COMMENT ON SCHEMA public IS 'iVISION Core Schema v3.0 - Unified Architecture';
NOTIFY pgrst, 'reload schema';

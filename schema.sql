-- REPARATION SYSTEME CHAT iVISION
-- Assure que les colonnes member_ids, created_by et is_private existent
-- et force Supabase à rafraîchir son cache de colonnes.

DO $$ 
BEGIN
    -- 1. Table channels
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'channels') THEN
        CREATE TABLE public.channels (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT DEFAULT 'project',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- 2. Colonne created_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='channels' AND column_name='created_by') THEN
        ALTER TABLE public.channels ADD COLUMN created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    -- 3. Colonne member_ids (Tableau d'UUID)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='channels' AND column_name='member_ids') THEN
        ALTER TABLE public.channels ADD COLUMN member_ids UUID[] DEFAULT '{}';
    END IF;

    -- 4. Colonne is_private
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='channels' AND column_name='is_private') THEN
        ALTER TABLE public.channels ADD COLUMN is_private BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 5. Publication temps réel
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.users, public.tasks, public.leads, public.clients, public.messages, public.channels;

-- 6. FORCE LE RECHARGEMENT DU CACHE PostgREST
-- Crucial pour corriger l'erreur "Could not find column"
COMMENT ON TABLE public.channels IS 'iVISION Channels v2.5 - Schema Verified';
NOTIFY pgrst, 'reload schema';
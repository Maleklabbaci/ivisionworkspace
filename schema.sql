
-- iVISION AGENCY FULL SYSTEM SCHEMA v4.8
-- Correction de la structure des projets

-- 1. MISE À JOUR DE LA TABLE PROJECTS
-- Ajout de la colonne billing_type si elle n'existe pas
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='billing_type') THEN
        ALTER TABLE public.projects ADD COLUMN billing_type TEXT DEFAULT 'monthly';
    END IF;
END $$;

-- Assurer que total_budget et spent_budget existent
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='total_budget') THEN
        ALTER TABLE public.projects ADD COLUMN total_budget NUMERIC DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='spent_budget') THEN
        ALTER TABLE public.projects ADD COLUMN spent_budget NUMERIC DEFAULT 0;
    END IF;
END $$;

-- 2. ACCUSÉS DE LECTURE MESSAGES
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS read_by UUID[] DEFAULT '{}';

-- 3. CRÉATION DU BUCKET AVATARS
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 4. POLITIQUES DE SÉCURITÉ
DROP POLICY IF EXISTS "Tout le monde peut voir les avatars" ON storage.objects;
CREATE POLICY "Tout le monde peut voir les avatars" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );

-- 5. FONCTION DE SUPPRESSION TOTALE
CREATE OR REPLACE FUNCTION public.delete_user_completely(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.users WHERE id = target_user_id;
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

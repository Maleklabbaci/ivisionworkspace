
-- iVISION AGENCY FULL SYSTEM SCHEMA v4.9
-- Extension de la gestion financière ADS

-- 1. MISE À JOUR DE LA TABLE AD_CAMPAIGNS
ALTER TABLE public.ad_campaigns 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;

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

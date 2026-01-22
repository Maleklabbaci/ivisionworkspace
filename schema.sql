
-- iVISION AGENCY FULL SYSTEM SCHEMA v4.7
-- Mise à jour pour les accusés de lecture

-- 1. AJOUT DE LA COLONNE READ_BY
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS read_by UUID[] DEFAULT '{}';

-- 2. CRÉATION DU BUCKET (Si non existant)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. POLITIQUES DE SÉCURITÉ POUR LE STOCKAGE
DROP POLICY IF EXISTS "Tout le monde peut voir les avatars" ON storage.objects;
DROP POLICY IF EXISTS "Les utilisateurs connectés peuvent uploader des avatars" ON storage.objects;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leurs propres avatars" ON storage.objects;

CREATE POLICY "Tout le monde peut voir les avatars" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
CREATE POLICY "Les utilisateurs connectés peuvent uploader des avatars" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );
CREATE POLICY "Les utilisateurs peuvent modifier leurs propres avatars" ON storage.objects FOR UPDATE USING ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

-- 4. FONCTION DE SUPPRESSION TOTALE
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

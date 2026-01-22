
-- iVISION AGENCY FULL SYSTEM SCHEMA v4.6
-- Système de Stockage des Avatars

-- 1. CRÉATION DU BUCKET (Si non existant)
-- Note: L'insertion dans storage.buckets nécessite des privilèges élevés.
-- Si cette partie échoue, créez manuellement un bucket nommé 'avatars' en mode PUBLIC dans l'interface Supabase.
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. POLITIQUES DE SÉCURITÉ POUR LE STOCKAGE
-- Supprimer les anciennes politiques pour éviter les doublons
DROP POLICY IF EXISTS "Tout le monde peut voir les avatars" ON storage.objects;
DROP POLICY IF EXISTS "Les utilisateurs connectés peuvent uploader des avatars" ON storage.objects;

-- Autoriser la lecture publique
CREATE POLICY "Tout le monde peut voir les avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Autoriser l'upload aux utilisateurs authentifiés
CREATE POLICY "Les utilisateurs connectés peuvent uploader des avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Autoriser la mise à jour/suppression de son propre fichier
CREATE POLICY "Les utilisateurs peuvent modifier leurs propres avatars"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

-- 3. FONCTION DE SUPPRESSION TOTALE (Rappelée ici pour cohérence)
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


import { createClient } from '@supabase/supabase-js';

// Configuration du projet Supabase iVISION
const supabaseUrl = 'https://cfpyrdcybgnefaqdyumb.supabase.co';

/**
 * Clé API active fournie : sb_publishable_9_MVHdIusXmJ_awvZdAl_w_2sTgGqoE
 * Note : L'erreur RLS indique que la clé est acceptée mais que l'opération est bloquée par la base.
 */
const supabaseAnonKey = 'sb_publishable_9_MVHdIusXmJ_awvZdAl_w_2sTgGqoE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'ivision-auth-token'
  }
});

/**
 * Vérifie si la connexion à Supabase est opérationnelle.
 */
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('configs').select('key').limit(1);
    if (error && (error.code === 'PGRST301' || error.message.includes('API key'))) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

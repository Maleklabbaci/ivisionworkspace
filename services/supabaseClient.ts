
import { createClient } from '@supabase/supabase-js';

// Configuration du projet Supabase iVISION
const supabaseUrl = 'https://cfpyrdcybgnefaqdyumb.supabase.co';
const supabaseAnonKey = 'sb_publishable_9_MVHdIusXmJ_awvZdAl_w_2sTgGqoE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    flowType: 'pkce'
  },
  global: {
    headers: { 'x-application-name': 'ivision-crystal' }
  }
});

/**
 * Utilitaire pour effectuer des requêtes sans planter en cas d'erreur réseau
 */
export const safeFetch = async <T>(promise: any, fallback: T): Promise<T> => {
  try {
    const { data, error } = await promise;
    if (error) {
      // Si l'erreur est liée à une entité non trouvée ou un accès refusé
      if (error.message?.includes('Requested entity was not found')) {
        console.error('Supabase: Entity not found');
      }
      return fallback;
    }
    return data || fallback;
  } catch (err: any) {
    // Capture spécifique de l'erreur "Failed to fetch" pour éviter les crashs UI
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      console.warn('Système iV: Problème de connexion au serveur Supabase (Failed to fetch). Passage en mode dégradé.');
    } else {
      console.error('Erreur Système critique:', err);
    }
    return fallback;
  }
};

export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};

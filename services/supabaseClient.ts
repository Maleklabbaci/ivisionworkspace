
import { createClient } from '@supabase/supabase-js';

// Configuration du projet Supabase iVISION
const supabaseUrl = 'https://cfpyrdcybgnefaqdyumb.supabase.co';
const supabaseAnonKey = 'sb_publishable_9_MVHdIusXmJ_awvZdAl_w_2sTgGqoE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage, // Utilisation explicite du localStorage
    flowType: 'pkce'
  },
  global: {
    headers: { 'x-application-name': 'ivision-crystal' }
  }
});

/**
 * Utilitaire pour effectuer des requêtes sans planter en cas d'erreur réseau
 */
// Fix: Use any for the promise parameter to avoid strict Type checking issues with Supabase builders (PostgrestFilterBuilder)
export const safeFetch = async <T>(promise: any, fallback: T): Promise<T> => {
  try {
    const { data, error } = await promise;
    if (error) {
      console.warn('Supabase partial error:', error);
      return fallback;
    }
    return data || fallback;
  } catch (err) {
    console.error('Network failure (Failed to fetch):', err);
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

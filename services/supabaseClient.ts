import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfpyrdcybgnefaqdyumb.supabase.co';
const supabaseAnonKey = 'sb_publishable_9_MVHdIusXmJ_awvZdAl_w_2sTgGqoE';

// Vérifie si l'utilisateur a configuré ses propres clés
export const isConfigured = true;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
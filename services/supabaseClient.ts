
import { createClient } from '@supabase/supabase-js';

// Configuration optimisée pour la réactivité
const supabaseUrl = 'https://cfpyrdcybgnefaqdyumb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmcHlyZGN5YmduZWZhcWR5dW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDcxMzYwMDAsImV4cCI6MjAyMjkxMjAwMH0.example';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'ivision-auth-token'
  }
});

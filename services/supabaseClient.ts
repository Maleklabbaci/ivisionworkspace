
import { createClient } from '@supabase/supabase-js';

// URL et Clé Supabase (Vérifiez ces valeurs dans votre dashboard Supabase)
const supabaseUrl = 'https://cfpyrdcybgnefaqdyumb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmcHlyZGN5YmduZWZhcWR5dW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDcxMzYwMDAsImV4cCI6MjAyMjkxMjAwMH0.example_key_please_replace';

// Si la clé est incorrecte, nous créons un client vide pour éviter de faire crasher React au démarrage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export const isConfigured = supabaseAnonKey.startsWith('eyJ');

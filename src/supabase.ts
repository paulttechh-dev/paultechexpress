import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (process.env.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (process.env.VITE_SUPABASE_ANON_KEY as string) || '';

// Basic URL validation
const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  isValidUrl(supabaseUrl) &&
  !supabaseUrl.includes('your-project-id') &&
  supabaseAnonKey !== 'your-anon-key' // Check for placeholder from .env.example
);

// Use placeholder values if not configured to avoid "supabaseUrl is required" error on load
// The app will show a setup screen instead of crashing
export const supabase = createClient(
  isValidUrl(supabaseUrl) ? supabaseUrl : 'https://fmtriznhlamqnvgfqjhs.supabase.co',
  supabaseAnonKey || 'placeholder'
);

// Helper to handle fetch errors globally
export const handleFetchError = (error: any) => {
  // Only log to console if it's not a common auth error that we handle in the UI
  const msg = error.message || '';
  const isAuthError = msg.includes('Invalid login credentials') || 
                     msg.includes('User already registered') || 
                     msg.includes('Email not confirmed');
  
  if (!isAuthError) {
    console.error("[Supabase Error]:", error);
  }

  if (msg === 'Failed to fetch') {
    alert("ERRO DE CONEXÃO: Não foi possível conectar ao Supabase. Verifique se:\n1. Seu projeto no Supabase não está PAUSADO.\n2. Sua internet está funcionando.\n3. As chaves VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão corretas no painel Secrets.");
  }
  return error;
};

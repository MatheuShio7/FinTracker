import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validação das variáveis de ambiente
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('As variáveis de ambiente do Supabase não foram configuradas corretamente.');
}

const isNative = Capacitor.isNativePlatform();

// Cria e exporta o cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // No app nativo o callback chega via deep link, não pela URL do WebView
    detectSessionInUrl: !isNative,
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
  },
});


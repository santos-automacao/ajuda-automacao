// Conexão com o banco (Supabase). Endereço e chave pública vêm do arquivo .env.
// Comparando com C#: é como a connection string do appsettings.json, só que a chave aqui é
// PÚBLICA — quem protege os dados são as regras do banco (RLS), não o segredo da chave.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const chave = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** null quando o .env não foi configurado: o app segue com o catálogo que vem dentro dele. */
export const supabase: SupabaseClient | null =
  url && chave
    ? createClient(url, chave, {
        // Sem login por enquanto. Quando o login entrar, guardar a sessão (expo-sqlite, ver guia da Expo).
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      })
    : null;

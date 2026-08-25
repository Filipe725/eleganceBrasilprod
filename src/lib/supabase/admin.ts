import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase com a service role key: ignora RLS por completo.
 * Uso exclusivo em Server Actions/Route Handlers — nunca importar em
 * código que roda no navegador (a chave nunca deve chegar ao cliente).
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY não configurada. Adicione-a ao .env.local (Supabase: Project Settings > API > service_role).'
    );
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

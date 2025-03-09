// FILE: lib/supabaseServerClient.ts

import { createServerClient } from "@supabase/ssr";

/**
 * Creates a server-side Supabase client that doesn't rely on cookies
 * since we have middleware handling refresh tokens and auth state
 */
export async function createServerClientSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Simple approach that relies on middleware for auth
        getAll() {
          return [];
        },
        setAll() {
          return;
        },
      },
    }
  );
}
// FILE: lib/supabaseServerClient.ts

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a server-side Supabase client,
 * using the "getAll"/"setAll" pattern from your SupabaseAuthGuide.md
 */
export async function createServerClientSupabase() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // No-op in SSR or if setAll is not needed
          }
        },
      },
    }
  );
}
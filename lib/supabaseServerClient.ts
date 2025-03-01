// FILE: lib/supabaseServerClient.ts

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a server-side Supabase client,
 * using the "getAll"/"setAll" pattern from your SupabaseAuthGuide.md
 */
export async function createServerClientSupabase() {
  // 1) "await" so we get a real cookie store object (not a Promise)
  const cookieStore = await cookies();

  // 2) Return a Supabase client that can read/write cookies
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Now cookieStore is an object; .getAll() is valid
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // If you rely on the middleware to handle sessions,
          // you can ignore or wrap in try/catch:
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
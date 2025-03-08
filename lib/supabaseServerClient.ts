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
          // In server components, we typically don't need to set cookies
          // as this is handled by the middleware or in API routes where
          // we have access to the response object
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          cookiesToSet; // Acknowledge parameter to satisfy linter
        },
      },
    }
  );
}
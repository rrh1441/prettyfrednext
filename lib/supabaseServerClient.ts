// FILE: lib/supabaseServerClient.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase server client for use in Server Components or
 * for SSR functions.
 */
export function createServerSupabaseClient() {
  // 1) Get the cookie store from Next.js
  const cookieStore = cookies();

  // 2) Return a server client with correct cookie handling
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Only getAll is allowed
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            // If you are inside a Server Component, you can attempt to set each cookie:
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // According to the guide, if this code is called from a pure Server Component,
            // we can ignore the "attempted to set cookie" error. 
          }
        },
      },
    }
  );
}
// FILE: lib/supabaseBrowserClient.ts
import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase browser client for use in Client Components.
 * This is the correct pattern according to the guide.
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
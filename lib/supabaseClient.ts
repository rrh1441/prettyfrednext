// FILE: lib/supabaseClient.ts

import { createClient } from "@supabase/supabase-js";

/**
 * Provide your Supabase project’s URL and Anon Key
 * via NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Named export "supabase"
 * so other files can do: import { supabase } from "@/lib/supabaseClient"
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
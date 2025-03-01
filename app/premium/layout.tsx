/* FILE: app/premium/layout.tsx */
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export default async function PremiumLayout({ children }: { children: ReactNode }) {
  // We pull the user's session from Supabase on the server
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // We only use getAll/setAll EXACTLY as the "SupabaseAuthGuide" demands
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // This can be safely ignored if you rely on middleware
          // or do not need to reissue cookies from the layout.
          // We'll just wrap in try/catch so SSR doesn't throw errors.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // no-op in SSR
          }
        },
      },
    }
  );

  // Check if there is a current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session, force redirect to /login
  if (!session) {
    redirect("/login");
  }

  // Otherwise, show the children (the premium content)
  return <>{children}</>;
}
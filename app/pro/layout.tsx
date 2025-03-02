/* FILE: app/pro/layout.tsx */

import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export default async function ProLayout({
  children,
}: {
  children: ReactNode;
}) {
  // 1) Get the actual cookie store object
  const cookieStore = await cookies();

  // 2) Create a server client using the recommended "getAll"/"setAll" pattern
  const supabase = createServerClient(
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
            // No-op in SSR if needed
          }
        },
      },
    }
  );

  // 3) Check for a session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session, redirect to /login
  if (!session) {
    redirect("/login");
  }

  // Otherwise, let them see the Pro content
  return <>{children}</>;
}
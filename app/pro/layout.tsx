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
  // 1) "await cookies()" so we can read them
  const cookieStore = await cookies();

  // 2) Create a server client
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
            // no-op
          }
        },
      },
    }
  );

  // 3) Check if the user has a valid session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If not logged in, send them to /login
  if (!session) {
    redirect("/login");
  }

  // 4) Retrieve subscriber record
  //    If your 'subscribers' table has columns:
  //       email (PK),
  //       name,
  //       plan,
  //       status,
  //    you can check if status === 'active'.
  const userEmail = session.user.email;
  if (!userEmail) {
    // If the user object has no email (rare), treat them as unsubscribed
    redirect("/signup");
  }

  const { data: subscriber, error } = await supabase
    .from("subscribers")
    .select("status")
    .eq("email", userEmail)
    .single();

  // If there's no subscriber row or status != 'active', redirect them
  if (!subscriber || subscriber.status !== "active") {
    redirect("/signup");
  }

  // Otherwise, user is subscribed => show the children
  return <>{children}</>;
}
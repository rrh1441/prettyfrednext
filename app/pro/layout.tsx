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

  // If not logged in => bounce to home page, open login modal
  if (!session) {
    redirect("/?auth=login");
  }

  // 4) Retrieve subscriber record if we do a paywall check
  const userEmail = session?.user?.email;
  if (!userEmail) {
    // If user object has no email, treat them as unsubscribed => open signup
    redirect("/?auth=signup");
  }

  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("status")
    .eq("email", userEmail)
    .single();

  // If no subscriber row or status != active => open signup tab
  if (!subscriber || subscriber.status !== "active") {
    redirect("/?auth=signup");
  }

  // Otherwise, user is subscribed => render the Pro content
  return <>{children}</>;
}
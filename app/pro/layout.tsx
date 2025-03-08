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
  // 1) Create the cookie store & Supabase server client
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // In server components, we typically don't need to set cookies
          // because that's handled by the middleware
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          cookiesToSet; // Acknowledge parameter to satisfy linter
        },
      },
    }
  );

  // 2) Check if the user has a valid session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If not logged in, redirect => /?auth=login
  if (!session) {
    redirect("/?auth=login");
  }

  // 3) Check subscriber table by user email
  const userEmail = session.user.email;
  if (!userEmail) {
    // No email => treat them as unsubscribed => go /?auth=signup
    redirect("/?auth=signup");
  }

  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("status")
    .eq("email", userEmail)
    .single();

  // If no row or status != active => /?auth=signup
  if (!subscriber || subscriber.status !== "active") {
    redirect("/?auth=signup");
  }

  // 4) Otherwise they're active => let them see /pro
  return <>{children}</>;
}
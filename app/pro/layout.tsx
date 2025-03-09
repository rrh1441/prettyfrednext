/* FILE: app/pro/layout.tsx */

import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export default async function ProLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Use a simpler approach for server components
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // In server components, we can use empty arrays since middleware handles cookies
        getAll() {
          return [];
        },
        setAll() {
          return;
        },
      },
    }
  );

  // Check if the user has a valid session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If not logged in, redirect => /?auth=login
  if (!session) {
    redirect("/?auth=login");
  }

  // Check subscriber table by user email
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

  // Otherwise they're active => let them see /pro
  return <>{children}</>;
}
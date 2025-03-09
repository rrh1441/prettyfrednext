/* FILE: app/pro/layout.tsx */
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

export default async function ProLayout({ children }: { children: ReactNode }) {
  console.log("[ProLayout] Checking user session on server side...");

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // For a standard server component, we might not have direct NextRequest here.
        // Usually the supabase auth state is refreshed in middleware, so we can just do empty arrays:
        getAll() {
          // We do not have direct access to request cookies in a server component
          console.log("[ProLayout] getAll called => returning empty array");
          return [];
        },
        setAll(cookiesToSet) {
          // Typically no-op in a layout: we rely on middleware
          console.log("[ProLayout] setAll called => ignoring (SSR layout).");
        },
      },
    }
  );

  // See if the user has a valid session
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("[ProLayout] supabase.auth.getSession error:", error.message);
  }
  console.log("[ProLayout] session =>", session);

  if (!session) {
    console.log("[ProLayout] No session. Redirecting to /?auth=login");
    redirect("/?auth=login");
  }

  // Check if we have a user email. If not, redirect
  const userEmail = session.user?.email;
  if (!userEmail) {
    console.log("[ProLayout] session.user has no email. Redirecting to /?auth=signup");
    redirect("/?auth=signup");
  }

  // Now check if they have "active" subscription
  const { data: subscriber, error: subError } = await supabase
    .from("subscribers")
    .select("status")
    .eq("email", userEmail)
    .single();

  if (subError) {
    console.error("[ProLayout] Error reading subscribers table:", subError.message);
    console.log("[ProLayout] We'll treat them as unsubscribed => redirect /?auth=signup");
    redirect("/?auth=signup");
  }

  if (!subscriber || subscriber.status !== "active") {
    console.log(`[ProLayout] subscriber missing or not active => ${subscriber?.status}`);
    redirect("/?auth=signup");
  }

  console.log("[ProLayout] Auth + Subscription checks passed. Rendering children...");

  return <>{children}</>;
}
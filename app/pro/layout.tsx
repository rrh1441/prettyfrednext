import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

export default async function ProLayout({ children }: { children: ReactNode }) {
  console.log("[ProLayout] Checking user session on server...");

  // Create a server client. Usually no cookies are needed here
  // because the middleware handles it, but we must implement them anyway.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Usually returns empty or relies on middleware
          console.log("[ProLayout] getAll => returning [] (no-op)");
          return [];
        },
        setAll(cookiesToSet) {
          // We'll just log them, no lint errors if we use cookiesToSet
          console.log("[ProLayout] setAll => ignoring, but param used =>", cookiesToSet.length);
        },
      },
    }
  );

  // Now let's see if user is logged in
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("[ProLayout] supabase.auth.getSession error:", error.message);
  }
  console.log("[ProLayout] session =>", session);

  if (!session) {
    // No session => redirect
    console.log("[ProLayout] No session found => redirect /?auth=login");
    redirect("/?auth=login");
  }

  // If you only need to che ck user is logged in, stop here.
  // If you also need a subscription check, do so:
  const userEmail = session.user?.email;
  if (!userEmail) {
    console.log("[ProLayout] No email => redirect /?auth=signup");
    redirect("/?auth=signup");
  }

  // Check if user is "active" in subscriber table
  const { data: subscriber, error: subError } = await supabase
    .from("subscribers")
    .select("status")
    .eq("email", userEmail)
    .single();

  if (subError) {
    console.error("[ProLayout] subscriber fetch error =>", subError.message);
    redirect("/?auth=signup");
  }

  if (!subscriber || subscriber.status !== "active") {
    console.log(`[ProLayout] Not active => ${subscriber?.status}`);
    redirect("/?auth=signup");
  }

  console.log("[ProLayout] Auth + subscriber checks => OK. Rendering children...");

  return <>{children}</>;
}
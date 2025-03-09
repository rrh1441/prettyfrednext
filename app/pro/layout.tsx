import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

export default async function ProLayout({ children }: { children: ReactNode }) {
  console.log("[ProLayout] Checking user session on server...");

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Typically no-op: we rely on middleware
          console.log("[ProLayout] getAll => returning [] (no-op)");
          return [];
        },
        setAll(cookiesToSet) {
          console.log("[ProLayout] setAll => ignoring, but param used =>", cookiesToSet.length);
        },
      },
    }
  );

  // 1) Check user session
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("[ProLayout] supabase.auth.getSession error:", error.message);
  }
  console.log("[ProLayout] session =>", session);

  if (!session) {
    console.log("[ProLayout] No session => redirect /?auth=login");
    redirect("/?auth=login");
  }

  // 2) Prepare userEmail
  let userEmail = session.user?.email ?? "";
  userEmail = userEmail.trim().toLowerCase(); // just in case of trailing space or case mismatch
  if (!userEmail) {
    console.log("[ProLayout] No userEmail => redirect /?auth=signup");
    redirect("/?auth=signup");
  }
  console.log(`[ProLayout] userEmail => '${userEmail}'`);

  // 3) Debug: list first 10 rows in subscribers
  const { data: debugSubs, error: debugSubsErr } = await supabase
    .from("subscribers")
    .select("*")
    .limit(10);

  console.log("[ProLayout] debugSubs =>", debugSubs, "error =>", debugSubsErr);

  // 4) Actually fetch the row for this user
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
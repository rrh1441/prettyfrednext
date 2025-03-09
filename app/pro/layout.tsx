// app/pro/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function ProLayout({ children }: { children: ReactNode }) {
  console.log("[ProLayout] Checking user session on server...");

  // Await the cookies so that we get a ReadonlyRequestCookies instance.
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Retrieve all cookies from the incoming request.
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Attempt to set cookies on the response. In Server Components, this may fail.
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Ignore errors here (e.g. if called from a Server Component)
            }
          });
        },
      },
    }
  );

  // 1) Check user session
  const sessionResult = await supabase.auth.getSession();
  if (sessionResult.error) {
    console.error(
      "[ProLayout] supabase.auth.getSession error:",
      sessionResult.error.message
    );
  }
  const session = sessionResult.data.session;
  console.log("[ProLayout] session =>", session);

  if (!session) {
    console.log("[ProLayout] No session => redirect /?auth=login");
    redirect("/?auth=login");
  }

  // 2) Prepare userEmail
  let userEmail = session.user?.email ?? "";
  userEmail = userEmail.trim().toLowerCase();
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
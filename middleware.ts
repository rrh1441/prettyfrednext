/* FILE: middleware.ts */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  console.log("[middleware] Entering middleware for:", request.nextUrl.pathname);

  // We'll store the NextResponse in a variable so we can mutate cookies
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create a Supabase server client that can refresh sessions
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const incoming = request.cookies.getAll();
          console.log("[middleware] getAll cookies =>", incoming);
          return incoming;
        },
        setAll(cookiesToSet) {
          console.log("[middleware] setAll cookies =>", cookiesToSet);

          cookiesToSet.forEach(({ name, value, options }) => {
            // Remove expires so it’s truly a session cookie
            delete options.expires;
            delete options.maxAge;

            // If debugging locally over HTTP:
            // options.secure = false;

            console.log("[middleware] Setting cookie on supabaseResponse:", {
              name,
              value,
              finalOptions: options,
            });

            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session: ensures the user session is up to date
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("[middleware] getSession error:", error.message);
  } else {
    console.log("[middleware] getSession => session:", session);
  }

  console.log("[middleware] Completed. Returning supabaseResponse.");

  return supabaseResponse;
}

// Only run middleware for these routes
export const config = {
  matcher: [
    // anything except _next/static|_next/image|favicon|public assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
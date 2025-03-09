import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  console.log("[middleware] Handling request:", request.nextUrl.pathname);

  // We'll keep a reference to the NextResponse
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create the Supabase server client for SSR
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const incoming = request.cookies.getAll();
          console.log("[middleware] getAll =>", incoming);
          return incoming;
        },
        setAll(cookiesToSet) {
          console.log("[middleware] setAll =>", cookiesToSet);

          cookiesToSet.forEach(({ name, value, options }) => {
            // Remove expiry => ephemeral cookie
            delete options.expires;
            delete options.maxAge;

            // If local dev with http:
            // options.secure = false;

            console.log("[middleware] Setting cookie =>", { name, value, finalOptions: options });
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Attempt to refresh session
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("[middleware] getSession error:", error.message);
  } else {
    console.log("[middleware] session =>", session);
  }

  return supabaseResponse;
}

// Match everything except static assets
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
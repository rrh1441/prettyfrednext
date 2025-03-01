// FILE: middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * This middleware will run only on paths matching the 'config.matcher' below.
 * We protect '/premium', but do NOT block '/', '/login', or other pages.
 */
export async function middleware(request: NextRequest) {
  // We build a modifiable response for re-issuing cookies if needed
  let supabaseResponse = NextResponse.next();

  // Create the server client with correct cookie usage.
  // 1) read from request.cookies.getAll()
  // 2) set cookies on both request & supabaseResponse
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // 1) update the in-flight request cookies
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          // 2) create a new NextResponse referencing the updated request
          supabaseResponse = NextResponse.next({ request });

          // 3) set cookies on the response so they are sent to the user
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Check if there's a logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user, redirect to /login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Otherwise, user is authenticated => proceed
  return supabaseResponse;
}

/**
 * Only match `/premium` routes:
 * - e.g., `/premium` or `/premium/whatever`
 * - Leaves other paths (like `/`) public
 */
export const config = {
  matcher: ["/premium/:path*"],
};
/* FILE: middleware.ts */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  // Build a modifiable response for re-issuing cookies if needed
  let supabaseResponse = NextResponse.next();

  // Create the server client with correct cookie usage
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Mirror any changes into the request, then into the response
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
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

  // If no user => redirect to home with ?auth=login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("auth", "login"); 
    return NextResponse.redirect(url);
  }

  // Otherwise, user is au thenticated => proceed
  return supabaseResponse;
}

/**
 * Only match `/pro` routes:
 * - e.g., `/pro` or `/pro/whatever`
 * - Leaves other paths (like `/`) public
 */
export const config = {
  matcher: ["/pro/:path*"],
};
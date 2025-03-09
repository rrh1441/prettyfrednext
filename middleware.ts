/* FILE: middleware.ts */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  // Create a response object
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Remove expires/maxAge to make them session cookies
            delete options.expires;
            delete options.maxAge;
            supabaseResponse.cookies.set(name, value, {
              ...options,
              // secure: true, // if you want https only
            });
          });
        },
      },
    }
  );

  // Refresh session - keeps auth in sync across SSR and client
  await supabase.auth.getSession();

  // Debug log
  console.log(`Middleware processing: ${request.nextUrl.pathname}`);
  
  // Return the response with session cookies
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
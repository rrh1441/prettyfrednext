// FILE: middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Middleware only runs on matched routes below (see "config" at bottom).
export async function middleware(request: NextRequest) {
  // We'll keep a modifiable response to set cookies if needed
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Create the server client with correct cookies usage
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // We must read from request.cookies.getAll()
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // The official pattern is to set them on both "request" and "supabaseResponse"
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Example: get the user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user, redirect them to login page (e.g. /login)
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/signup') &&
    !request.nextUrl.pathname.startsWith('/api') // optional
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If the user is valid or route is unprotected, proceed
  return supabaseResponse;
}

// Next.js route matcher
export const config = {
  // This pattern means: everything except Next.js assets or static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
// FILE: middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  // 1) Force all traffic to www.prettyfred.com
  const host = request.headers.get("host") || "";
  if (!host.includes("www.prettyfred.com")) {
    // Build a new URL pointing to the correct domain
    const url = new URL(request.url);
    url.hostname = "www.prettyfred.com";
    return NextResponse.redirect(url, 301);
  }

  // 2) Normal Supabase SSR code below...
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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
            delete options.expires;
            delete options.maxAge;
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) {
    console.error("[middleware] getSession error:", error.message);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
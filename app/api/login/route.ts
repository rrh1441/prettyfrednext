import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * POST /api/login
 */
export async function POST(request: Request) {
  try {
    // 1) Parse email/password from request body
    const { email, password } = await request.json();

    // 2) Create a 302 Redirect response to /pro
    //    We'll attach cookies to THIS response if login succeeds.
    const supabaseResponse = NextResponse.redirect(new URL("/pro", request.url), 302);

    // 3) Create a Supabase server client, hooking into the above response's cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          // If you need to read request cookies for anything:
          getAll() {
            return request.headers.get("cookie")
              ? [{ name: "cookie", value: request.headers.get("cookie") ?? "", options: {} }]
              : [];
          },
          setAll(cookiesToSet) {
            // For each cookie Supabase wants to set,
            // we'll attach it to supabaseResponse
            cookiesToSet.forEach(({ name, value, options }) => {
              // Remove any 'expires'/'maxAge' => ephemeral session cookie
              delete options.expires;
              delete options.maxAge;

              // If you're only using HTTP locally, might need: options.secure = false;

              supabaseResponse.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // 4) Attempt sign-in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // If Supabase returns an error, respond with JSON 400
      return new NextResponse(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // If user is missing => weird edge case
    if (!data.user) {
      return new NextResponse(JSON.stringify({ error: "No user returned from Supabase." }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    console.log("[login/route.ts] Login success =>", data.user);

    // 5) If success => Return the 302 redirect response with ephemeral cookies attached
    //    The user’s browser will automatically redirect to /pro with the session cookie.
    return supabaseResponse;
  } catch (err) {
    console.error("[login/route.ts] Unexpected error =>", err);
    return new NextResponse(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
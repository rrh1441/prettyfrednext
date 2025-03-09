import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * POST /api/login
 */
export async function POST(request: Request) {
  try {
    // 1) Parse email/password from request body
    const { email, password } = await request.json();

    // 2) Prepare a 302 Redirect response to /pro
    //    We'll attach cookies to THIS response if login succeeds.
    const redirectResponse = NextResponse.redirect(
      new URL("/pro", request.url),
      302
    );

    // 3) Create a Supabase server client, hooking into the above response's cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          // If you need to read cookies from the request, parse them here
          getAll() {
            const cookieHeader = request.headers.get("cookie");
            if (!cookieHeader) return [];
            return [
              {
                name: "cookie",
                value: cookieHeader,
                options: {},
              },
            ];
          },
          setAll(cookiesToSet) {
            // For each cookie Supabase wants to set,
            // we attach it to redirectResponse
            cookiesToSet.forEach(({ name, value, options }) => {
              // Make ephemeral: remove expires/maxAge
              delete options.expires;
              delete options.maxAge;
              // If local dev over HTTP, do: options.secure = false

              redirectResponse.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // 4) Attempt sign-in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      // If Supabase returns an error, respond with JSON 400
      return new NextResponse(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // If user is missing => weird edge case
    if (!data.user) {
      return new NextResponse(JSON.stringify({ error: "No user returned." }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    console.log("[login/route.ts] Login success =>", data.user);

    // 5) Return the 302 redirect with ephemeral cookies attached
    return redirectResponse;
  } catch (err) {
    console.error("[login/route.ts] Unexpected error =>", err);
    return new NextResponse(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
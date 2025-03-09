import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  console.log("[login/route.ts] POST /api/login called.");

  try {
    const { email, password } = await request.json();
    console.log("[login/route.ts] Credentials =>", { email, passwordExists: Boolean(password) });

    // We'll return a JSON response with status 200 by default
    const response = NextResponse.json({ success: true }, { status: 200 });

    // Create the Supabase server client, hooking into cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const incoming = request.cookies.getAll();
            console.log("[login/route.ts] getAll =>", incoming);
            return incoming;
          },
          setAll(cookiesToSet) {
            console.log("[login/route.ts] setAll =>", cookiesToSet);
            cookiesToSet.forEach(({ name, value, options }) => {
              // Remove any expiration so they're ephemeral session cookies
              delete options.expires;
              delete options.maxAge;

              // If your site is HTTPS, keep secure: true. If testing locally over http, set secure = false.
              // options.secure = false;

              console.log("[login/route.ts] Setting cookie:", { name, value, finalOptions: options });
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error("[login/route.ts] Error signing in:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (!data.user) {
      console.log("[login/route.ts] No user returned from signInWithPassword.");
      return NextResponse.json({ error: "No user returned" }, { status: 400 });
    }

    console.log("[login/route.ts] Sign-in success. User =>", data.user);

    // Return JSON with user data, carrying over cookies in the response
    return NextResponse.json(
      { user: data.user },
      { status: 200, headers: response.headers }
    );
  } catch (err) {
    console.error("[login/route.ts] Unexpected error:", err);
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
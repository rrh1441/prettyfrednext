/* FILE: app/api/login/route.ts */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: NextRequest) {
  console.log("[login/route.ts] POST endpoint called.");

  try {
    // Parse login credentials from request body
    const { email, password } = await req.json();
    console.log("[login/route.ts] Credentials received:", { email, passwordExists: Boolean(password) });

    // Create the NextResponse object
    const response = NextResponse.json({ success: true }, { status: 200 });

    // Create a Supabase server client that sets cookies on `response`
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const incoming = req.cookies.getAll();
            console.log("[login/route.ts] getAll cookies =>", incoming);
            return incoming;
          },
          setAll(cookiesToSet) {
            console.log("[login/route.ts] setAll cookies =>", cookiesToSet);

            cookiesToSet.forEach(({ name, value, options }) => {
              // Remove expiration so it becomes a session cookie
              delete options.expires;
              delete options.maxAge;

              // If testing locally over HTTP, you might not want secure
              // options.secure = false; // <— Only if debugging locally

              console.log("[login/route.ts] Setting cookie:", {
                name,
                value,
                finalOptions: options,
              });

              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Actually attempt to sign the user in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("[login/route.ts] Error signing in:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      console.log("[login/route.ts] No user returned from supabase.auth.signInWithPassword.");
      return NextResponse.json({ error: "No user returned from sign-in" }, { status: 400 });
    }

    console.log("[login/route.ts] Sign-in success. Supabase user:", data.user);

    // Return a JSON response with the user data, and crucially, pass along the cookies
    return NextResponse.json(
      { user: data.user },
      {
        status: 200,
        headers: response.headers, // copy over the set-cookie headers
      }
    );
  } catch (err) {
    console.error("[login/route.ts] Unexpected error:", err);
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
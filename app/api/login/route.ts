/* FILE: app/api/login/route.ts */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: NextRequest) {
  try {
    // Parse login credentials
    const { email, password } = await req.json();

    // Create response FIRST - will be used to set cookies
    const response = NextResponse.json({ success: true }, { status: 200 });

    // Initialize Supabase client with THIS response
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            // Return all cookies from the incoming request
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              // 1) Remove any expiry so browser treats it as a session cookie
              delete options.expires;
              delete options.maxAge;
              // 2) Set cookies on our response
              response.cookies.set(name, value, {
                ...options,
                // If you want them only over HTTPS:
                // secure: true,
                // If you want them strictly same-site:
                // sameSite: "strict",
              });
            });
          },
        },
      }
    );

    // Perform sign-in, which will set auth cookies on our response
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Handle sign-in errors
    if (error) {
      console.error("Login error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Log successful login
    console.log("Login successful for:", email);
    
    // Important: Return our response object with the cookies
    return NextResponse.json(
      { user: data.user },
      { 
        status: 200,
        headers: response.headers, // carry over all cookie headers
      }
    );
  } catch (err) {
    console.error("Unexpected login error:", err);
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
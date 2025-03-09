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
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Set cookies on our response object
              response.cookies.set(name, value, options);
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
    
    // Important: Return our response object that has the cookies set on it
    // But update its body to include user data
    return NextResponse.json(
      { user: data.user },
      { 
        status: 200,
        // Copy all headers from our response with cookies
        headers: response.headers
      }
    );
  } catch (err) {
    console.error("Unexpected login error:", err);
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
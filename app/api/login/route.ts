import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Create the response first - this is the one we'll return
    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );

    // Create Supabase client with proper cookie handling
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
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Server sign-in: store tokens in cookies
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Update response data with user info
    return NextResponse.json(
      { user: data?.user },
      { 
        status: 200,
        headers: response.headers // Use headers from response with cookies
      }
    );
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 400 }
    );
  }
}
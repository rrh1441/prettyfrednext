// app/api/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    // Create response to hold cookies
    const response = NextResponse.json({ status: "authenticating" });
    
    // Initialize Supabase with proper cookie handling
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

    // Sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Return the response with auth cookies but update the body content
    return new NextResponse(
      JSON.stringify({ user: data.user }),
      { 
        status: 200,
        headers: response.headers 
      }
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: NextRequest) {
  // Create a new response to properly handle cookies
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

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

  try {
    const { email, password } = await req.json();

    // Server sign-in: store tokens in cookies
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return new NextResponse(
        JSON.stringify({ error: error.message }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return success with the cookies set in the response
    const body = JSON.stringify({ user: data?.user });
    return new NextResponse(body, {
      status: 200,
      headers: response.headers,
    });
  } catch (err) {
    return new NextResponse(
      JSON.stringify({ error: String(err) }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
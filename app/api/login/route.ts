import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: NextRequest) {
  let supabaseResponse = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Mirror any changes to the supabaseResponse
          cookiesToSet.forEach(({ name, value }) => {
            req.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value }) => {
            supabaseResponse.cookies.set(name, value);
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

    const body = JSON.stringify({ user: data?.user });
    // Return success, plus supabaseResponse’s cookies
    const final = new NextResponse(body, {
      status: 200,
      headers: supabaseResponse.headers,
    });
    supabaseResponse.cookies.getAll().forEach((c) => {
      final.cookies.set(c.name, c.value);
    });
    return final;
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
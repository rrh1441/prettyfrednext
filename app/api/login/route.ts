import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  console.log("[login/route.ts] POST /api/login called.");

  // 1) Parse credentials
  const { email, password } = await request.json();
  console.log("[login/route.ts] Credentials =>", { email, passwordExists: Boolean(password) });

  // 2) Create a base response we can attach cookies to
  const baseResponse = NextResponse.next();

  // 3) Create supabase server client that sets cookies on baseResponse
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Remove expires => ephemeral session cookie
            delete options.expires;
            delete options.maxAge;
            // If you're on https, keep secure = true. For local dev over http, do secure = false:
            // options.secure = false;
            baseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 4) Attempt to sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    console.error("[login/route.ts] Error signing in:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data.user) {
    console.log("[login/route.ts] No user returned from signInWithPassword");
    return NextResponse.json({ error: "No user returned" }, { status: 400 });
  }

  console.log("[login/route.ts] Sign-in success =>", data.user);

  // 5) Now do an immediate **redirect** to /pro
  //    We pass along the cookies in baseResponse.headers
  return NextResponse.redirect("https://www.prettyfred.com/pro", {
    status: 302,
    headers: baseResponse.headers,
  });
}
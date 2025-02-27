"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface PlanType {
  plan: "monthly" | "annual";
}

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const initialPlanParam = searchParams.get("plan");
  const [plan, setPlan] = useState<PlanType["plan"]>(
    initialPlanParam === "annual" ? "annual" : "monthly"
  );

  const supabase = createClientComponentClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Basic password requirements
  const passwordRequirements = [
    { regex: /.{6,}/, message: "At least 6 characters" },
    { regex: /[a-z]/, message: "At least one lowercase letter" },
    { regex: /[A-Z]/, message: "At least one uppercase letter" },
    { regex: /\d/,   message: "At least one digit" },
  ];

  function validatePassword(pwd: string): string[] {
    return passwordRequirements
      .filter((req) => !req.regex.test(pwd))
      .map((req) => req.message);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    // 1) Check password requirements
    const pwdErrors = validatePassword(password);
    if (pwdErrors.length > 0) {
      setErrorMsg(`Password must have: ${pwdErrors.join(", ")}.`);
      setLoading(false);
      return;
    }

    try {
      // 2) Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            plan: plan,
          },
        },
      });
      if (authError) {
        throw new Error(`Sign-up failed: ${authError.message}`);
      }
      if (!authData?.user) {
        throw new Error("No user returned after sign-up.");
      }

      // 3) Upsert to 'subscribers' table
      const { error: subscriberError } = await supabase.from("subscribers").upsert(
        {
          id: authData.user.id, // typically the PK
          email: email,
          full_name: fullName,
          plan: plan,
          status: "pending",    // you can track states like 'pending' until payment
        },
        { onConflict: "email" }
      );
      if (subscriberError) {
        console.error("Error upserting subscriber:", subscriberError);
        throw new Error(`Failed to upsert subscriber: ${subscriberError.message}`);
      }

      // 4) Create Stripe checkout session on your custom API route
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }

      const { url } = await response.json();
      if (!url) {
        throw new Error("No checkout URL received from server.");
      }

      // 5) Redirect to Stripe checkout
      window.location.href = url;
    } catch (err) {
      console.error("Signup error:", err);
      setErrorMsg(err instanceof Error ? err.message : "Unknown error.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-[440px] overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="space-y-2 border-b bg-white p-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            You&apos;ve reached your free limit
          </h1>
          <p className="text-sm text-gray-500">
            Get unlimited access to all features
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Error Message */}
          {errorMsg && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-600/10">
              {errorMsg}
            </div>
          )}

          {/* Plan Selection */}
          <div className="space-y-3">
            <div className="inline-flex w-full rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => setPlan("monthly")}
                className={`w-1/2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  plan === "monthly"
                    ? "bg-white shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setPlan("annual")}
                className={`w-1/2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  plan === "annual"
                    ? "bg-white shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Annual
              </button>
            </div>

            {/* Example Price Display */}
            <div className="text-center">
              <div className="text-3xl font-bold">$8</div>
              <div className="text-sm text-gray-500">/month</div>
            </div>

            {/* Features List */}
            <ul className="space-y-3 py-4">
              <li className="flex items-center text-sm">
                <svg
                  className="mr-3 h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292..." />
                </svg>
                Everything you get:
              </li>
              <li className="flex items-center text-sm">
                <svg
                  className="mr-3 h-5 w-5 text-green-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 ..." clipRule="evenodd" />
                </svg>
                Unlimited searches
              </li>
              <li className="flex items-center text-sm">
                <svg
                  className="mr-3 h-5 w-5 text-green-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 ..." clipRule="evenodd" />
                </svg>
                Favorite tracking
              </li>
              <li className="flex items-center text-sm">
                <svg
                  className="mr-3 h-5 w-5 text-green-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 ..." clipRule="evenodd" />
                </svg>
                Priority support
              </li>
            </ul>
          </div>

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="block w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="John Smith"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-gray-500">
                Must include uppercase, lowercase, number, &amp; be at least 6 characters.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full rounded-lg bg-black px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading && (
                <svg
                  className="mr-2 inline h-4 w-4 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373..."
                  />
                </svg>
              )}
              {loading ? "Creating your account..." : "Create Account and Subscribe"}
            </button>

            <div className="text-center text-sm text-gray-500">
              Secure payment powered by Stripe. Cancel anytime.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
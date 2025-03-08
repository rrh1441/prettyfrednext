"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

/** 1) Zod Schema for the sign-up form fields. */
const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Name must be at least 2 characters" })
      .max(100, { message: "Name must be less than 100 characters" })
      .regex(/^[a-zA-Z\s-]+$/, {
        message: "Name can only contain letters, spaces, and hyphens",
      }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
      .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
      .regex(/[0-9]/, { message: "Password must contain at least one number" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

/** Hard-coded monthly/annual pricing. */
const prices = {
  monthly: 8,
  annual: 80,
};

/** The main list of Pro features for display. */
const features = [
  "Completely customize your charts",
  "Access to 80+ data series with realtime updates",
  "Export data in multiple formats",
  "Request any FRED data series",
];

export default function SignupForm() {
  // Plan toggle: monthly vs annual
  const [plan, setPlan] = useState<"monthly" | "annual">("monthly");

  // States for sign-up
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // React Hook Form setup
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  /** Handle sign-up and immediately trigger Stripe checkout. */
  async function onSubmit(data: SignupFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      // A) Sign up with Supabase
      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
          },
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      // B) If sign-up worked, create a Stripe checkout session:
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }), // "monthly" or "annual"
      });
      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }
      const { url } = await response.json();
      if (!url) {
        throw new Error("No session URL returned from server");
      }

      // C) Redirect user to Stripe Checkout
      window.location.href = url;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred during signup. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Render a “paywall-like” sign-up experience
  return (
    <div className="h-screen w-full overflow-y-auto bg-white px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-lg border border-gray-200 shadow-lg rounded-md p-6">
        {/* Heading */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Unlock PrettyFRED Pro</h1>
        </div>

        {/* Plan toggle */}
        <div className="flex justify-center space-x-2 mb-4">
          <button
            onClick={() => setPlan("monthly")}
            className={`px-4 py-2 rounded-md font-semibold text-sm ${
              plan === "monthly"
                ? "bg-gray-100 text-black"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPlan("annual")}
            className={`px-4 py-2 rounded-md font-semibold text-sm ${
              plan === "annual"
                ? "bg-gray-100 text-black"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            Annual
          </button>
        </div>

        {/* Price info */}
        <div className="text-center mb-4">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold">${prices[plan]}</span>
            <span className="text-gray-500">
              {plan === "monthly" ? "/month" : "/year"}
            </span>
          </div>
          {plan === "annual" && (
            <p className="text-sm text-gray-600">Save more when paying annually</p>
          )}
        </div>

        {/* Feature bullet points */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            Everything you get with Pro:
          </div>
          <ul className="space-y-1 text-sm">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Signup Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Signup form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                `Create Account and Subscribe`
              )}
            </Button>

            <p className="text-xs text-center text-gray-500 mt-2">
              Secure payment powered by Stripe. Cancel anytime.
            </p>
          </form>
        </Form>
      </div>
    </div>
  );
}
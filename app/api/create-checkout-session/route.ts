/* FILE: app/api/create-checkout-session/route.ts */

import { NextResponse } from "next/server";
import Stripe from "stripe";

/** Maps your known Stripe price IDs to "monthly" or "annual" plan labels. */
function mapPriceIdToPlan(priceId: string): string {
  switch (priceId) {
    case "price_1R0pA5KSaqiJUYkjpQ9GTUur":
      return "monthly";
    case "price_1R0p9kKSaqiJUYkjWcBZE8nV":
      return "annual";
    default:
      return "unknown";
  }
}

export async function POST(request: Request) {
  try {
    // 1) Parse the plan choice from the request body
    const body = await request.json();
    const { plan } = body as { plan: string };

    // 2) Read your Stripe secret key from environment
    const stripeSecret = process.env.STRIPE_TEST_SECRET_KEY;
    if (!stripeSecret) {
      return NextResponse.json(
        { error: "Stripe key not configured" },
        { status: 500 },
      );
    }

    // 3) Initialize Stripe
    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2025-02-24.acacia", // your chosen version
    });

    // 4) Use your live-mode price IDs
    const priceIdMonthly = "price_1R0pA5KSaqiJUYkjpQ9GTUur";
    const priceIdAnnual = "price_1R0p9kKSaqiJUYkjWcBZE8nV";
    const chosenPriceId = plan === "annual" ? priceIdAnnual : priceIdMonthly;

    // Optionally derive the plan label from the chosen price ID
    const planLabel = mapPriceIdToPlan(chosenPriceId);

    // 5) Create a subscription Checkout Session
    //    IMPORTANT: enable the 'allow_promotion_codes' option
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: chosenPriceId,
          quantity: 1,
        },
      ],
      success_url: "https://prettyfred.com/pro?success=true",
      cancel_url: "https://prettyfred.com/pro?canceled=true",
      metadata: {
        plan: planLabel,
      },
      allow_promotion_codes: true,  // <--- This is the crucial part
    });

    // 6) Return the Checkout Session URL
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
/* FILE: app/api/create-checkout-session/route.ts */
import { NextResponse } from "next/server";
import Stripe from "stripe";

/** Maps your known Stripe price IDs to "monthly" or "annual" plan labels. */
function mapPriceIdToPlan(priceId: string): string {
  switch (priceId) {
    case "price_1QwxGFKSaqiJUYkjaGZq3fSe":
      return "monthly";
    case "price_1QwxH0KSaqiJUYkj23gzUY4Q":
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

    // 2) Read your Stripe test secret key from environment
    const stripeSecret = process.env.STRIPE_TEST_SECRET_KEY;
    if (!stripeSecret) {
      return NextResponse.json({ error: "Stripe key not configured" }, { status: 500 });
    }

    // 3) Initialize Stripe
    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2025-02-24.acacia", // your chosen version
    });

    // 4) Hardcode or map to actual price IDs
    const priceIdMonthly = "price_1QwxGFKSaqiJUYkjaGZq3fSe";
    const priceIdAnnual = "price_1QwxH0KSaqiJUYkj23gzUY4Q";
    const chosenPriceId = plan === "annual" ? priceIdAnnual : priceIdMonthly;

    // Optionally derive the plan label from the chosen price ID
    const planLabel = mapPriceIdToPlan(chosenPriceId);

    // 5) Create a subscription Checkout Session
    // Store plan in `metadata` so we can read it later in the webhook
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
      // If you want name/email in your webhooks, you can also pass it as metadata
      metadata: {
        plan: planLabel,
      },
    });

    // 6) Return the Checkout Session URL
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
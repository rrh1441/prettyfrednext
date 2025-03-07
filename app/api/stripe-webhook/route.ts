/* FILE: app/api/stripe-webhook/route.ts */
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Helper to map a Stripe price ID to a plan label. */
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

export const config = {
  // If needed, disable body parsing or adapt to handle raw request
  // e.g. `api: { bodyParser: false }`
};

const RELEVANT_EVENTS = new Set([
  "checkout.session.completed",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

export async function POST(request: Request) {
  // 1) Convert request body to buffer for signature verification
  let buf: Buffer;
  try {
    const rawBytes = await request.arrayBuffer();
    buf = Buffer.from(rawBytes);
  } catch (err) {
    console.error("Error reading webhook request body:", err);
    return NextResponse.json({ error: "Cannot read body" }, { status: 400 });
  }

  // 2) Stripe webhook secret from your environment
  const webhookSecret = process.env.STRIPE_TEST_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("No Stripe webhook secret found in env");
    return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 });
  }

  // 3) Get the signature
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    console.error("No stripe-signature header present");
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  // 4) Construct Stripe event
  let event: Stripe.Event;
  try {
    const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY || "", {
      apiVersion: "2025-01-27.acacia",
    });
    event = stripe.webhooks.constructEvent(buf, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // 5) Skip irrelevant events
  if (!RELEVANT_EVENTS.has(event.type)) {
    return NextResponse.json({ status: "ignored", event: event.type });
  }

  // 6) Build Supabase server client
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // no-op if SSR
          }
        },
      },
    }
  );

  // Helper to upsert into your "subscribers" table, matching on email (the PK)
  async function upsertSubscriber(
    email: string,
    name: string | null,
    plan: string | null,
    status: string
  ) {
    try {
      const { error } = await supabase
        .from("subscribers")
        .insert([
          {
            email,
            name,
            plan,
            status,
            updated_at: new Date().toISOString(),
          },
        ])
        .onConflict("email")
        .merge({
          name,
          plan,
          status,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error(`Error upserting subscriber (email=${email}):`, error.message);
      } else {
        console.log(`Upserted subscriber. email=${email}, plan=${plan}, status=${status}`);
      }
    } catch (err) {
      console.error("Error in upsertSubscriber:", err);
    }
  }

  // 7) Switch on the event type
  try {
    switch (event.type) {
      // -------------------------------------------------
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_details?.email ?? session.customer_email;
        if (!email) {
          console.log("No email found in checkout.session.completed");
          break;
        }

        // Attempt to read name & plan from session
        const name = session.customer_details?.name ?? null;
        // If we set metadata.plan, we can read it here
        const plan = session.metadata?.plan || null;

        // Mark them active
        await upsertSubscriber(email, name, plan, "active");
        break;
      }

      // -------------------------------------------------
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const email = invoice.customer_email || null;
        if (!email) {
          console.log("No email in invoice.payment_succeeded");
          break;
        }

        // Optionally parse plan from the first invoice line
        // E.g., using the price ID => mapPriceIdToPlan()
        let plan = null;
        const line = invoice.lines.data[0];
        if (line?.price?.id) {
          plan = mapPriceIdToPlan(line.price.id);
        }

        // Or if you stored plan in metadata:
        // plan = invoice.metadata?.plan || null;

        // If you have a name in metadata, you can do:
        const name = invoice.metadata?.name || null;

        await upsertSubscriber(email, name, plan, "active");
        break;
      }

      // -------------------------------------------------
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const email = invoice.customer_email || null;
        if (!email) {
          console.log("No email in invoice.payment_failed");
          break;
        }

        // Possibly parse plan from the invoice line or metadata
        let plan = null;
        const line = invoice.lines.data[0];
        if (line?.price?.id) {
          plan = mapPriceIdToPlan(line.price.id);
        }
        const name = invoice.metadata?.name || null;

        // Mark them "past_due"
        await upsertSubscriber(email, name, plan, "past_due");
        break;
      }

      // -------------------------------------------------
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        // Usually store email in sub.metadata
        const email = sub.metadata?.email || null;
        if (!email) {
          console.log("No email in subscription.updated metadata");
          break;
        }

        // Parse name from metadata or somewhere else
        const name = sub.metadata?.name || null;

        // The plan might be gleaned from the price ID
        let plan = null;
        const item = sub.items?.data[0];
        if (item?.price?.id) {
          plan = mapPriceIdToPlan(item.price.id);
        }

        // Convert Stripe subscription status to your local
        const newStatus = sub.status === "canceled" ? "canceled" : sub.status;

        await upsertSubscriber(email, name, plan, newStatus);
        break;
      }

      // -------------------------------------------------
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const email = sub.metadata?.email || null;
        if (!email) {
          console.log("No email in subscription.deleted metadata");
          break;
        }

        let plan = null;
        const item = sub.items?.data[0];
        if (item?.price?.id) {
          plan = mapPriceIdToPlan(item.price.id);
        }
        const name = sub.metadata?.name || null;

        // Mark them canceled
        await upsertSubscriber(email, name, plan, "canceled");
        break;
      }

      // -------------------------------------------------
      default: {
        console.log(`Unhandled event type: ${event.type}`);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Error handling webhook event:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
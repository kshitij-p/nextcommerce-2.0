import { PaymentStatus } from "@prisma/client";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { env } from "~/env";
import { paymentService } from "~/server/services/payment";
import { stripe } from "~/server/services/stripe";

export const POST = async (req: Request) => {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature")!;

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      env.STRIPE_WH_SEC,
    );
  } catch (error) {
    const errMsg =
      error instanceof Error ? error.message : "Something went wrong";
    return new Response(`Webhook Error: ${errMsg}`, { status: 400 });
  }

  console.info("STRIPE WEBHOOK RECEIVED", event.type);
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const { id: checkoutId } = event.data.object;
        await paymentService.webhookUpdateStatus({
          checkoutId,
          status: PaymentStatus.SUCCESSFUL,
        });
        break;
      }

      case "checkout.session.expired": {
        const { id: checkoutId } = event.data.object;
        await paymentService.webhookUpdateStatus({
          checkoutId,
          status: PaymentStatus.EXPIRED,
        });
        break;
      }
    }
  } catch (e) {
    console.info("FAILED TO PROCESS STRIPE WEBHOOK", event.type, e);
  }

  return new Response("Success", {
    status: 200,
  });
};

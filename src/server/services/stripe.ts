import Stripe from "stripe";
import { env } from "~/env";

export const createStripeClient = () => {
  return new Stripe(env.STRIPE_API_KEY);
};
const globalForStripe = globalThis as unknown as {
  stripe: ReturnType<typeof createStripeClient> | undefined;
};

export const stripe = globalForStripe.stripe ?? createStripeClient();

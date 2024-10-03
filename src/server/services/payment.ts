import { type TypeOf, z } from "zod";
import { db } from "../db";
import { stripe } from "./stripe";
import { TRPCError } from "@trpc/server";
import { PaymentStatus, type Prisma } from "@prisma/client";
import { env } from "~/env";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export const listPaymentsDto = z.object({
  skip: z.coerce.number().default(0),
  take: z.coerce.number().default(10),
  status: z.nativeEnum(PaymentStatus).optional(),
});

const listPayments = async (
  { status, skip, take }: TypeOf<typeof listPaymentsDto>,
  userId: string,
) => {
  const filters: Prisma.PaymentWhereInput = {
    userId,
    status,
  };

  const [payments, count] = await Promise.all([
    db.payment.findMany({
      where: filters,
      skip,
      take,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                assets: true,
                price: true,
              },
            },
          },
        },
      },
    }),
    db.payment.count({ where: filters }),
  ]);

  return {
    items: payments,
    total: count,
  };
};

export const getPaymentDto = z.object({
  id: z.string().optional(),
});
const getPayment = async ({ id }: TypeOf<typeof getPaymentDto>) => {
  const product = await db.product.findFirst({
    where: {
      id,
    },
  });

  return {
    item: product,
  };
};

export const createPaymentDto = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number(),
      cartItemId: z.string().optional(),
    }),
  ),
});
export const create = async (
  { items }: TypeOf<typeof createPaymentDto>,
  userId: string,
) => {
  let user = await db.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user?.email || !user.name)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `user id ${userId} not found`,
    });

  if (!user.stripeCustomerId) {
    const stripeCustomer = await stripe.customers.create({
      name: user.name,
      email: user.email,
    });
    user = await db.user.update({
      where: {
        id: userId,
      },
      data: {
        stripeCustomerId: stripeCustomer.id,
      },
    });
  }

  const products = await db.product.findMany({
    where: {
      id: {
        in: items.map((item) => item.productId),
      },
    },
  });

  if (products.length !== items.length)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `some of the given product's dont exist. Expected ${items.length} products, got ${products.length}`,
    });

  const lineItems = items.map((item) => {
    const product = products.find((x) => x.id === item.productId);
    if (!product)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `product id ${item.productId} doesn't exist.`,
      });

    return { price: product.stripePriceId, quantity: item.quantity };
  });

  const checkout = await stripe.checkout.sessions.create({
    line_items: lineItems,
    mode: "payment",
    ui_mode: "hosted",
    customer: user.stripeCustomerId ?? undefined,
    client_reference_id: user.id,
    customer_update: {
      address: "auto",
      name: "auto",
    },
    billing_address_collection: "required",
    success_url: `${env.HOST_URL}/account/orders`,
    cancel_url: `${env.HOST_URL}/account/orders`,
    currency: "USD",
  });

  const payment = await db.payment.create({
    data: {
      items: {
        createMany: {
          data: items,
          skipDuplicates: true,
        },
      },
      user: {
        connect: {
          id: userId,
        },
      },
      checkoutId: checkout.id,
      paymentLink: checkout.url!,
      status: PaymentStatus.PENDING,
      expiresAt: new Date(checkout.expires_at * 1000),
      total: checkout.amount_total ?? 0,
    },
  });

  return { item: payment };
};

export const webhookUpdateStatus = async ({
  checkoutId,
  status,
}: {
  checkoutId: string;
  status: PaymentStatus;
}) => {
  try {
    const payment = await db.payment.update({
      where: {
        checkoutId,
        status: PaymentStatus.PENDING,
      },
      data: {
        status,
        expiresAt: status !== "PENDING" ? null : undefined,
      },
      include: {
        items: true,
      },
    });
    if (!payment) {
      console.error(`couldnt find payment for checkoutId: ${checkoutId}`);
      return;
    }

    const cartItemIdsToDelete = [];
    for (const item of payment.items) {
      if (!item.cartItemId) continue;
      cartItemIdsToDelete.push(item.cartItemId);
    }

    await db.cartItem.deleteMany({
      where: {
        id: {
          in: cartItemIdsToDelete,
        },
      },
    });
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
      console.error(`couldnt find payment for checkoutId: ${checkoutId}`);
      return;
    }
  }
};

export const cancelPaymentDto = z.object({
  id: z.string(),
});

export const cancelPayment = async (
  { id }: TypeOf<typeof cancelPaymentDto>,
  userId: string,
) => {
  let payment = await db.payment.findFirst({ where: { id, userId } });

  if (!payment)
    throw new TRPCError({
      code: "NOT_FOUND",
    });

  if (payment.status !== PaymentStatus.PENDING)
    throw new TRPCError({ code: "CONFLICT" });
  try {
    await stripe.checkout.sessions.expire(payment.checkoutId);
  } catch (e) {
    console.error("failed to expire checkout session", payment.checkoutId, e);
  }

  payment = await db.payment.update({
    where: {
      id,
    },
    data: {
      status: PaymentStatus.EXPIRED,
      expiresAt: null,
    },
  });

  return { item: payment };
};

export const paymentService = {
  list: listPayments,
  get: getPayment,
  create,
  webhookUpdateStatus,
  cancel: cancelPayment,
};

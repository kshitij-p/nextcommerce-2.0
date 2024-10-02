import { type TypeOf, z } from "zod";
import { db } from "../db";
import { TRPCError } from "@trpc/server";
import { paymentService } from "./payment";

const getOrCreateCart = async (userId: string) => {
  let cart = await db.cart.findFirst({
    where: {
      userId,
    },
    include: {
      cartItem: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
      },
    },
  });
  if (!cart) {
    cart = await db.cart.create({
      data: {
        userId,
      },
      include: {
        cartItem: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });
  }
  return cart;
};

const getCart = async (userId: string) => {
  const cart = await getOrCreateCart(userId);
  return { item: cart };
};

export const upsertCartItemDto = z.object({
  productId: z.string(),
  quantity: z.number(),
});
const upsertItem = async (
  { productId, quantity }: TypeOf<typeof upsertCartItemDto>,
  userId: string,
) => {
  const cart = await getOrCreateCart(userId);
  const item = await db.cartItem.upsert({
    where: {
      cartId_productId: { cartId: cart.id, productId },
    },
    create: {
      quantity,
      cartId: cart.id,
      productId,
    },
    update: {
      quantity,
    },
    include: {
      product: true,
    },
  });

  return { item };
};

export const deleteCartItemDto = z.object({
  id: z.string(),
});
const deleteItem = async (
  { id }: TypeOf<typeof deleteCartItemDto>,
  userId: string,
) => {
  const item = await db.cartItem.delete({
    where: {
      id,
      cart: {
        userId,
      },
    },
  });
  if (!item) throw new TRPCError({ code: "NOT_FOUND" });
  return { item };
};

export const checkout = async (userId: string) => {
  const cart = await getOrCreateCart(userId);

  if (!cart.cartItem.length)
    throw new TRPCError({ code: "BAD_REQUEST", message: "your cart is empty" });

  return await paymentService.create(
    {
      items: cart.cartItem.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        cartItemId: item.id,
      })),
    },
    userId,
  );
};

export const cartService = {
  get: getCart,
  upsertItem,
  checkout,
  deleteItem,
};

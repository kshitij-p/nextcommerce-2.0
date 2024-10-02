import {
  cartService,
  deleteCartItemDto,
  upsertCartItemDto,
} from "~/server/services/cart";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const cartRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const resp = await cartService.get(ctx.session.user.id);
    return resp;
  }),
  checkout: protectedProcedure.mutation(async ({ ctx }) => {
    const resp = await cartService.checkout(ctx.session.user.id);
    return resp;
  }),
  upsertItem: protectedProcedure
    .input(upsertCartItemDto)
    .mutation(async ({ input, ctx }) => {
      const resp = await cartService.upsertItem(input, ctx.session.user.id);
      return resp;
    }),
  deleteItem: protectedProcedure
    .input(deleteCartItemDto)
    .mutation(async ({ input, ctx }) => {
      const resp = await cartService.deleteItem(input, ctx.session.user.id);
      return resp;
    }),
});

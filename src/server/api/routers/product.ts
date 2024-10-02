import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  createProductDto,
  deleteProductDto,
  getProductDto,
  listProductsDto,
  productService,
} from "~/server/services/product";

export const productRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),
  list: publicProcedure.input(listProductsDto).query(async ({ input }) => {
    const resp = await productService.list(input);
    return resp;
  }),
  get: publicProcedure.input(getProductDto).query(async ({ input }) => {
    const resp = await productService.get(input);
    return resp;
  }),
  create: protectedProcedure
    .input(createProductDto)
    .mutation(async ({ input, ctx }) => {
      const resp = await productService.create(input, ctx.session.user.id);
      return resp;
    }),
  delete: protectedProcedure
    .input(deleteProductDto)
    .mutation(async ({ input, ctx }) => {
      const resp = await productService.delete(input, ctx.session.user.id);
      return resp;
    }),
});

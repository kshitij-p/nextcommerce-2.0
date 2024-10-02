import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
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
});

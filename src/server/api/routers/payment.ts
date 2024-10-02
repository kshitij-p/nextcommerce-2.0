import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  cancelPaymentDto,
  createPaymentDto,
  getPaymentDto,
  listPaymentsDto,
  paymentService,
} from "~/server/services/payment";

export const paymentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createPaymentDto)
    .mutation(async ({ ctx, input }) => {
      const resp = await paymentService.create(input, ctx.session.user.id);
      return resp;
    }),
  list: protectedProcedure
    .input(listPaymentsDto)
    .query(async ({ input, ctx }) => {
      const resp = await paymentService.list(input, ctx.session.user.id);
      return resp;
    }),
  get: publicProcedure.input(getPaymentDto).query(async ({ input }) => {
    const resp = await paymentService.get(input);
    return resp;
  }),
  cancel: protectedProcedure
    .input(cancelPaymentDto)
    .mutation(async ({ input, ctx }) => {
      const resp = await paymentService.cancel(input, ctx.session.user.id);
      return resp;
    }),
});

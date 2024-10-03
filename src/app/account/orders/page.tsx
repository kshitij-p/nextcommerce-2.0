/* eslint-disable @next/next/no-img-element */
"use client";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

import { Separator } from "~/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { api } from "~/trpc/react";
import { MAX_STALE_TIME } from "~/constants";
import { type Payment, PaymentStatus } from "@prisma/client";
import { cn } from "~/lib/utils";
import { useSession } from "next-auth/react";
import { usePagination } from "~/hooks/use-pagination";
import { useTotalPages } from "~/hooks/use-total-pages";
import { keepPreviousData } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Skeleton } from "~/components/ui/skeleton";
import { PaginationControls } from "~/components/pagination-controls";

export default function PaymentsPage() {
  const utils = api.useUtils();
  const { data: session } = useSession();

  const { skip, take, pageSize, setPageSize, page, setPage } = usePagination();
  const { data } = api.payment.list.useQuery(
    {
      skip,
      take,
    },
    {
      enabled: !!session,
      staleTime: MAX_STALE_TIME,
      placeholderData: keepPreviousData,
    },
  );
  const totalPages = useTotalPages(data?.total ?? 0, pageSize);

  const payments = useMemo(() => {
    if (!data) return [];
    return data.items.map((item) => {
      const createdAt = new Date(item.createdAt);
      const formattedCreatedAt = `${createdAt.toLocaleDateString()} ${createdAt.toLocaleTimeString()}`;

      return {
        ...item,
        formattedCreatedAt,
      };
    });
  }, [data]);

  const { mutateAsync: cancelPayment, isPending: isCancellingPayment } =
    api.payment.cancel.useMutation({
      onSuccess: async () => {
        await utils.payment.list.invalidate();
        await utils.payment.get.invalidate();

        setPaymentToCancel(undefined);
      },
    });

  const [paymentToCancel, setPaymentToCancel] = useState<Payment | undefined>();

  return (
    <div className="container mx-auto px-4 py-8">
      <AlertDialog
        open={!!paymentToCancel}
        onOpenChange={(open) => {
          if (!open) {
            setPaymentToCancel(undefined);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {
                "This will cancel this payment and you will not be able to complete it via the link"
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              onClick={async () => {
                if (!paymentToCancel) return;
                await cancelPayment({ id: paymentToCancel.id });
              }}
              disabled={isCancellingPayment}
            >
              Continue
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <h1 className="mb-8 text-3xl font-bold">Orders</h1>
      <div className="space-y-6">
        {payments?.length ? (
          payments.map((payment) => {
            const firstPayment = payment.items[0];

            return (
              <Card key={payment.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Payment #{payment.id}</span>
                    <span
                      className={`rounded-full px-2 py-1 text-sm ${
                        payment.status === PaymentStatus.PENDING
                          ? "bg-yellow-100 text-yellow-800"
                          : payment.status === PaymentStatus.SUCCESSFUL
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {payment.status.charAt(0).toUpperCase() +
                        payment.status.slice(1)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-gray-500">
                    Date: {payment.formattedCreatedAt}
                  </p>
                  <Accordion
                    type="single"
                    collapsible
                    className="w-full [&>div]:border-none"
                  >
                    <AccordionItem value="items">
                      <AccordionTrigger
                        className={cn(
                          "hover:no-underline",
                          payment.items.length <= 1 && "[&>svg]:hidden",
                        )}
                        disabled={payment.items.length <= 1}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="relative h-20 w-20 overflow-hidden rounded-md">
                            <img
                              className="h-full w-full object-cover"
                              src={firstPayment?.product?.assets[0]?.publicUrl}
                              alt={`An image of ${firstPayment?.product?.name ?? "Unknown roduct"}`}
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold">
                              {firstPayment?.product?.name ?? ""}
                            </h3>
                            <p className="text-start text-sm text-gray-500">
                              $
                              {+(
                                firstPayment?.product?.price.toString() ?? "0"
                              ) / 100}
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {payment.items.slice(1).map((item) => (
                          <div
                            key={item.id}
                            className="mt-4 flex items-center space-x-4"
                          >
                            <div className="relative h-20 w-20 overflow-hidden rounded-md">
                              <img
                                className="h-full w-full object-cover"
                                src={item.product?.assets[0]?.publicUrl}
                                alt={`An image of ${item.product?.name ?? "Unknown roduct"}`}
                              />
                            </div>
                            <div>
                              <h3 className="font-semibold">
                                {item.product?.name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                $
                                {+(item?.product?.price.toString() ?? "0") /
                                  100}
                              </p>
                            </div>
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-semibold">
                      ${+(payment.total.toString() ?? "0") / 100}
                    </span>
                  </div>
                </CardContent>
                {payment.status === PaymentStatus.PENDING && (
                  <CardFooter className="space-x-2">
                    <Button variant={"default"} asChild>
                      <a href={payment.paymentLink}>Complete Payment</a>
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setPaymentToCancel(payment);
                      }}
                    >
                      Expire Payment
                    </Button>
                  </CardFooter>
                )}
              </Card>
            );
          })
        ) : (
          <>
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </>
        )}
      </div>
      <PaginationControls
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        setPage={setPage}
        setPageSize={setPageSize}
      />
    </div>
  );
}

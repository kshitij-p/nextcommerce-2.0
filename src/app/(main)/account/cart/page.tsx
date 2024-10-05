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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Trash } from "lucide-react";
import { useMemo } from "react";
import { api } from "~/trpc/react";
import { MAX_STALE_TIME } from "~/constants";
import { useSession } from "next-auth/react";
import { cn } from "~/lib/utils";
import { Skeleton } from "~/components/ui/skeleton";
import { Image } from "~/components/ui/image";
import { imageAlts } from "~/lib/image-alt";

export default function CartPage() {
  const utils = api.useUtils();

  const { data } = useSession();

  const { data: cart, isLoading: isLoadingCart } = api.cart.get.useQuery(
    undefined,
    {
      enabled: !!data,
      staleTime: MAX_STALE_TIME,
      select: ({ item }) => item,
    },
  );

  const { mutateAsync: checkoutCart, isPending: isCheckingOut } =
    api.cart.checkout.useMutation({
      onSuccess: async ({ item }) => {
        await utils.payment.list.invalidate();
        await utils.payment.get.invalidate();
        await utils.cart.get.invalidate();

        window.location.href = item.paymentLink;
      },
    });

  const {
    mutateAsync: upsertCartItem,
    isPending: isUpsertingCartItem,
    variables: upsertCartItemVars,
  } = api.cart.upsertItem.useMutation({
    onMutate: ({ productId, quantity }) => {
      utils.cart.get.setData(undefined, (data) => {
        if (!data) return data;

        const updatedData = structuredClone(data);

        for (const item of updatedData.item.cartItem) {
          if (item.productId === productId) {
            item.quantity = quantity;
            break;
          }
        }

        return updatedData;
      });
    },
    onSuccess: async () => {
      await utils.cart.invalidate();
    },
    onError: async () => {
      await utils.cart.get.invalidate();
    },
  });

  const {
    mutateAsync: deleteCartItem,
    isPending: isDeletingCartItem,
    variables: deleteCartItemVars,
  } = api.cart.deleteItem.useMutation({
    onMutate: ({ id: deletedId }) => {
      utils.cart.get.setData(undefined, (data) => {
        if (!data) return data;

        const updatedData = structuredClone(data);

        updatedData.item.cartItem = updatedData.item.cartItem.filter(
          (x) => x.id !== deletedId,
        );

        return updatedData;
      });
    },
    onSettled: async () => {
      await utils.cart.get.invalidate();
    },
  });

  // const updateQuantity = (id: string, quantity: number) => {
  //   setCartItems(
  //     cartItems.map((item) => (item.id === id ? { ...item, quantity } : item)),
  //   );
  // };

  // const removeItem = (id: string) => {
  //   setCartItems(cartItems.filter((item) => item.id !== id));
  // };

  const totalPrice = useMemo(() => {
    const total =
      cart?.cartItem.reduce(
        (sum, item) => sum + +item.product.price * item.quantity,
        0,
      ) ?? 0;
    return total / 100;
  }, [cart]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Your Shopping Cart</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {cart ? (
            cart.cartItem.length ? (
              cart.cartItem.map((item) => {
                const isUpsertingCurrItem =
                  isUpsertingCartItem &&
                  upsertCartItemVars.productId === item.productId;
                const isDeletingCurrItem =
                  isDeletingCartItem && deleteCartItemVars?.id === item.id;

                return (
                  <Card
                    key={item.id}
                    className={cn(
                      "mb-6",
                      (isUpsertingCurrItem ||
                        isDeletingCurrItem ||
                        isCheckingOut) &&
                        "opacity-75",
                    )}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="relative h-24 w-24 overflow-hidden rounded-md">
                          <Image
                            className="h-full w-full object-cover"
                            src={item.product.assets[0]?.publicUrl}
                            alt={imageAlts.product(item.product)}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">
                            {item.product.name}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            ${+item.product.price / 100}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Select
                            disabled={
                              isDeletingCartItem ||
                              isUpsertingCartItem ||
                              isCheckingOut
                            }
                            value={item.quantity.toString()}
                            onValueChange={async (value) => {
                              await upsertCartItem({
                                productId: item.productId,
                                quantity: +value,
                              });
                            }}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue placeholder="Quantity" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteCartItem({ id: item.id })}
                            disabled={
                              isDeletingCartItem ||
                              isUpsertingCartItem ||
                              isCheckingOut
                            }
                          >
                            <Trash className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-medium text-neutral-200">
                Your cart is empty.
              </div>
            )
          ) : (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-36 w-full" />
            </div>
          )}
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between py-2">
                <span>Subtotal</span>
                {cart ? (
                  <span>${totalPrice.toFixed(2)}</span>
                ) : (
                  <Skeleton className="h-6 w-20" />
                )}
              </div>
              <div className="flex justify-between py-2">
                <span>Shipping</span>
                <span className="font-medium">FREE</span>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between py-2 font-semibold">
                <span>Total</span>
                {cart ? (
                  <span>${totalPrice.toFixed(2)}</span>
                ) : (
                  <Skeleton className="h-6 w-28" />
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => checkoutCart()}
                size="lg"
                disabled={
                  isLoadingCart ||
                  isUpsertingCartItem ||
                  isDeletingCartItem ||
                  isCheckingOut
                }
              >
                Proceed to Checkout
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

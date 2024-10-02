/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState } from "react";
import { ShoppingBag, Menu } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";
import { MAX_STALE_TIME } from "~/constants";
import { useParams } from "next/navigation";
import { type Product } from "@prisma/client";
import { toast } from "sonner";
import { Skeleton } from "~/components/ui/skeleton";

export default function ProductDetails() {
  const utils = api.useUtils();

  const { id } = useParams<{ id: string }>();

  const [selectedSize, setSelectedSize] = useState("M");
  const [quantity, setQuantity] = useState(1);

  const { data: product } = api.product.get.useQuery(
    { id },
    {
      staleTime: MAX_STALE_TIME,
      select: ({ item }) => item,
    },
  );

  const [activeIdx, setActiveIdx] = useState(0);
  const activeImg = useMemo(() => {
    if (!product) return;
    const idx = Math.max(0, Math.min(activeIdx, product.assets.length - 1));
    return product.assets[idx];
  }, [product, activeIdx]);

  const { mutateAsync: upsertCartItem, isPending: isUpsertingCartItem } =
    api.cart.upsertItem.useMutation({
      onMutate: ({ productId, quantity }) => {
        utils.cart.get.setData(undefined, (data) => {
          if (!data) return data;

          const updatedData = structuredClone(data);

          let updated = false;
          for (const item of updatedData.item.cartItem) {
            if (item.productId === productId) {
              item.quantity = quantity;
              updated = true;
              break;
            }
          }
          if (!updated && product) {
            updatedData.item.cartItem.push({
              cartId: updatedData.item.id,
              id: `temp-id-${new Date().toJSON()}-${Math.random() * 10}`,
              product: product as unknown as Product,
              productId,
              quantity: quantity,
            });
          }

          return updatedData;
        });
      },
      onSuccess: async ({ item: upsertedItem }) => {
        utils.cart.get.setData(undefined, (data) => {
          if (!data) return data;

          const updatedData = structuredClone(data);

          let updated = false;
          updatedData.item.cartItem = updatedData.item.cartItem.map((x) => {
            if (x.productId === upsertedItem.productId) {
              updated = true;
              return { ...x, id: upsertedItem.id };
            }
            return x;
          });
          if (!updated) {
            updatedData.item.cartItem.push(upsertedItem);
          }

          return updatedData;
        });
        toast("Added to cart");
      },
      onError: async () => {
        await utils.cart.get.invalidate();
      },
    });

  const { mutateAsync: createPayment, isPending: isCreatingPayment } =
    api.payment.create.useMutation({
      onSuccess: async ({ item }) => {
        await utils.payment.list.invalidate();
        await utils.payment.get.invalidate();

        window.location.href = item.paymentLink;
      },
    });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Menu className="h-6 w-6 md:hidden" />
          <nav className="hidden space-x-8 text-sm md:flex">
            <a href="#" className="hover:underline">
              Women
            </a>
            <a href="#" className="hover:underline">
              Men
            </a>
            <a href="#" className="hover:underline">
              Accessories
            </a>
            <a href="#" className="hover:underline">
              Collections
            </a>
          </nav>
          <h1 className="text-2xl font-semibold">LUXE BRAND</h1>
          <div className="flex items-center space-x-4">
            <a
              href="#"
              className="hidden text-sm hover:underline md:inline-block"
            >
              Account
            </a>
            <ShoppingBag className="h-6 w-6" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-[9/10] h-auto w-full rounded-lg object-cover">
              {product ? (
                <img
                  className="h-full w-full rounded-lg object-cover"
                  src={activeImg?.publicUrl}
                  alt="Elegant Silk Dress"
                />
              ) : (
                <Skeleton className="h-full w-full" />
              )}
            </div>
            <div className="grid grid-cols-4 gap-4">
              {product ? (
                product?.assets.slice(0, 4).map((asset, idx) => {
                  return (
                    <button
                      className="group aspect-[8/6] h-auto w-full appearance-none overflow-hidden rounded-lg object-cover"
                      key={asset.id}
                      onClick={() => setActiveIdx(idx)}
                    >
                      <img
                        src={asset.publicUrl}
                        alt="Dress Detail 1"
                        className="h-full w-full rounded-lg object-cover transition group-hover:scale-105 group-hover:opacity-75"
                      />
                    </button>
                  );
                })
              ) : (
                <>
                  <Skeleton className="aspect-[8/6] h-full w-full" />
                  <Skeleton className="aspect-[8/6] h-full w-full" />
                  <Skeleton className="aspect-[8/6] h-full w-full" />
                  <Skeleton className="aspect-[8/6] h-full w-full" />
                </>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              {product ? (
                <>
                  <h2 className="text-3xl font-semibold">{product?.name}</h2>
                  <p className="mt-2 text-xl">${+product.price / 100}</p>
                </>
              ) : (
                <div className="space-y-1">
                  <Skeleton className="h-8 w-60" />
                  <Skeleton className="h-7 w-24" />
                </div>
              )}
            </div>
            {product ? (
              <p className="text-gray-300">{product?.description}</p>
            ) : (
              <div className="flex flex-col gap-1">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full max-w-80" />
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-sm font-medium">Size</h3>
                <div className="flex space-x-2">
                  {["XS", "S", "M", "L", "XL"].map((size) => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? "default" : "outline"}
                      onClick={() => setSelectedSize(size)}
                      className="h-10 w-10"
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-medium">Quantity</h3>
                <Select
                  value={quantity.toString()}
                  onValueChange={(val) => setQuantity(+val)}
                >
                  <SelectTrigger className="w-24">
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
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                className="flex-1 py-6"
                onClick={async () => {
                  if (!product) return;
                  await createPayment({
                    items: [{ productId: product.id, quantity }],
                  });
                }}
                disabled={isCreatingPayment}
              >
                Buy Now
              </Button>
              <Button
                variant={"outline"}
                className="flex-1 py-6"
                onClick={async () => {
                  if (!product) return;
                  await upsertCartItem({
                    productId: product.id,
                    quantity,
                  });
                }}
                disabled={isUpsertingCartItem}
              >
                Add to Cart
              </Button>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Product Details</h3>
              <ul className="list-disc space-y-2 pl-5">
                {product ? (
                  product.productDetails.map((item, idx) => {
                    return <li key={idx}>{item}</li>;
                  })
                ) : (
                  <>
                    <Skeleton className="h-6 w-full max-w-48" />
                    <Skeleton className="h-6 w-full max-w-48" />
                    <Skeleton className="h-6 w-full max-w-48" />
                  </>
                )}
              </ul>
            </div>
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="care">
                <AccordionTrigger>Care Instructions</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc space-y-2 pl-5">
                    {product ? (
                      product.careDetails.map((item, idx) => {
                        return <li key={idx}>{item}</li>;
                      })
                    ) : (
                      <>
                        <Skeleton className="h-6 w-full max-w-48" />
                        <Skeleton className="h-6 w-full max-w-48" />
                        <Skeleton className="h-6 w-full max-w-48" />
                      </>
                    )}
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="shipping">
                <AccordionTrigger>Shipping & Returns</AccordionTrigger>
                <AccordionContent>
                  {product ? (
                    product.shippingReturns
                  ) : (
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full max-w-80" />
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Related Products */}
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-semibold">You May Also Like</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <Card key={item}>
                <CardContent className="p-4">
                  <img
                    src={
                      "https://pub-052bc15d6b604762ae76f9b3a603d345.r2.dev/2AE14CDD-1265-470C-9B15F49024186C10_source.jpg"
                    }
                    alt={`Related Product ${item}`}
                    className="mb-4 h-auto w-full rounded-lg object-cover"
                  />
                  <h3 className="font-medium">Luxurious Item {item}</h3>
                  <p className="mt-1 text-sm text-gray-600">$999.00</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

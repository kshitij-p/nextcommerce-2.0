"use client";

import { type Product } from "@prisma/client";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { MAX_STALE_TIME } from "~/constants";
import { api } from "~/trpc/react";

const ProductPage = () => {
  const router = useRouter();
  const utils = api.useUtils();

  const { id } = useParams<{ id: string }>();

  const { data: cart } = api.cart.get.useQuery(undefined, {
    staleTime: MAX_STALE_TIME,
    select: ({ item }) => item,
  });

  const { data: product } = api.product.get.useQuery(
    { id },
    {
      staleTime: MAX_STALE_TIME,
      select: ({ item }) => item,
    },
  );

  const { mutateAsync: upsertCartItem } = api.cart.upsertItem.useMutation({
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

  const { mutateAsync: deleteCartItem } = api.cart.deleteItem.useMutation({
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
    onError: async () => {
      await utils.cart.get.invalidate();
    },
  });

  const { mutateAsync: createPayment } = api.payment.create.useMutation({
    onSuccess: async ({ item }) => {
      await utils.payment.list.invalidate();
      await utils.payment.get.invalidate();

      window.location.href = item.paymentLink;
    },
  });
  const { mutateAsync: checkoutCart } = api.cart.checkout.useMutation({
    onSuccess: async ({ item }) => {
      await utils.payment.list.invalidate();
      await utils.payment.get.invalidate();
      await utils.cart.get.invalidate();

      window.location.href = item.paymentLink;
    },
  });

  const { mutateAsync: deleteProduct } = api.product.delete.useMutation({
    onSuccess: async () => {
      router.push("/products");

      await utils.product.list.invalidate();
      await utils.product.get.invalidate();
      await utils.cart.get.invalidate();
      await utils.payment.invalidate();
    },
  });

  const cartTotal = useMemo(() => {
    return (
      cart?.cartItem.reduce(
        (prev, curr) => prev + curr.quantity * +curr.product.price,
        0,
      ) ?? 0
    );
  }, [cart]);

  return (
    <div>
      <div>
        <span>Cart</span>
        <ul>
          {cart?.cartItem.map((item) => {
            const isTemp = item.id.startsWith("temp-id");

            return (
              <li key={item.id}>
                {item.product.name} x {item.quantity}
                <button
                  onClick={async () => {
                    await deleteCartItem({ id: item.id });
                  }}
                  disabled={isTemp}
                >
                  Delete
                </button>
                <button
                  className="ml-4"
                  onClick={async () => {
                    await upsertCartItem({
                      productId: item.productId,
                      quantity: item.quantity + 1,
                    });
                  }}
                  disabled={isTemp}
                >
                  +
                </button>
                <button
                  className="ml-4"
                  onClick={async () => {
                    if (item.quantity <= 1) {
                      await deleteCartItem({ id: item.id });
                    } else {
                      await upsertCartItem({
                        productId: item.productId,
                        quantity: item.quantity - 1,
                      });
                    }
                  }}
                  disabled={isTemp}
                >
                  -
                </button>
              </li>
            );
          })}
        </ul>
        <span>Total {cartTotal}</span>
        <button
          onClick={async () => {
            await checkoutCart();
          }}
        >
          Checkout cart
        </button>
      </div>

      <h2 className="mt-16">{product?.name}</h2>
      <h2>${product?.price}</h2>
      <button
        onClick={async () => {
          if (!product) return;
          await createPayment({
            items: [{ productId: product.id, quantity: 1 }],
          });
        }}
      >
        Buy now
      </button>
      <button
        onClick={async () => {
          if (!product) return;
          await upsertCartItem({
            productId: product.id,
            quantity: 1,
          });
        }}
      >
        Add to cart
      </button>
      <Button
        onClick={async () => {
          if (!product) return;
          await deleteProduct({ id });
        }}
      >
        Delete Product
      </Button>
    </div>
  );
};

export default ProductPage;

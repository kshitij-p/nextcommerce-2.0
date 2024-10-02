"use client";

import { useParams } from "next/navigation";
import { MAX_STALE_TIME } from "~/constants";
import { api } from "~/trpc/react";

const ProductPage = () => {
  const utils = api.useUtils();

  const { id } = useParams<{ id: string }>();

  const { data } = api.product.get.useQuery(
    { id },
    {
      staleTime: MAX_STALE_TIME,
    },
  );
  const product = data?.item;

  const { mutateAsync: createPayment } = api.payment.create.useMutation({
    onSuccess: async ({ item }) => {
      await utils.payment.list.invalidate();
      await utils.payment.get.invalidate();

      window.location.href = item.paymentLink;
    },
  });

  return (
    <div>
      <h2>{product?.name}</h2>
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
    </div>
  );
};

export default ProductPage;

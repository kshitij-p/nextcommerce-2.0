"use client";

import { MAX_STALE_TIME } from "~/constants";
import { api } from "~/trpc/react";

const ProductPage = () => {
  const { data } = api.product.list.useQuery(
    {},
    {
      staleTime: MAX_STALE_TIME,
    },
  );

  return (
    <div>
      <h2>Products</h2>
      <ul>
        {data?.items.map((product) => {
          return (
            <a href={`/products/${product.id}`} key={product.id}>
              {product.name} ${product.price.toString()}
            </a>
          );
        })}
      </ul>
    </div>
  );
};

export default ProductPage;

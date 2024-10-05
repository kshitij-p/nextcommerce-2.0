"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import CreateUpdateProduct from "../../_components";
import { keepPreviousData } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

const EditProductPage = () => {
  const { data } = useSession();
  const { id } = useParams<{ id: string }>();

  const { data: product } = api.product.get.useQuery(
    { id },
    {
      enabled: !!id,
      select: (data) => data.item,
      staleTime: Infinity,
      placeholderData: keepPreviousData,
    },
  );

  return (
    <div>
      {product ? (
        product.userId === data?.user.id ? (
          <CreateUpdateProduct product={product} />
        ) : (
          <div className="container mx-auto flex min-h-screen items-center justify-center text-2xl">
            {"You aren't authorized to do this"}
          </div>
        )
      ) : (
        <div className="relative w-full">
          <div className="pointer-events-none w-full opacity-50">
            <CreateUpdateProduct />
          </div>
          <div className="-translate-y-/12 absolute inset-0 left-1/2 top-1/2 z-10 h-max w-max -translate-x-1/2 text-lg">
            Loading...
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProductPage;

/* eslint-disable @next/next/no-img-element */
"use client";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Pencil, Plus, Trash } from "lucide-react";
import { api } from "~/trpc/react";
import { MAX_STALE_TIME } from "~/constants";
import { useSession } from "next-auth/react";
import { Skeleton } from "~/components/ui/skeleton";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { useState } from "react";
import { type SerializedProduct } from "~/server/services/product";
import { toast } from "sonner";
import { usePagination } from "~/hooks/use-pagination";
import { PaginationControls } from "~/components/pagination-controls";

export default function AccountPage() {
  const { id } = useParams<{ id: string }>();
  const utils = api.useUtils();

  const { data: session } = useSession();

  const { skip, take, pageSize, setPageSize, page, setPage } = usePagination();
  const { data } = api.product.list.useQuery(
    {
      userId: session?.user.id,
      skip,
      take,
    },
    {
      staleTime: MAX_STALE_TIME,
    },
  );
  const products = data?.items;

  const [productToDelete, setProductToDelete] = useState<
    SerializedProduct | undefined
  >();

  const { mutateAsync: deleteProduct, isPending: isDeletingProduct } =
    api.product.delete.useMutation({
      onSuccess: async () => {
        await utils.product.list.invalidate();
        await utils.product.get.invalidate();
        await utils.cart.get.invalidate();
        await utils.payment.invalidate();

        toast.success("Deleted product");
        setProductToDelete(undefined);
      },
    });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <AlertDialog
          open={!!productToDelete}
          onOpenChange={(open) => {
            if (!open) {
              setProductToDelete(undefined);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {
                  "This will delete your product and it won't be visible to customers, except in their payment receipts."
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button
                onClick={async () => {
                  if (!productToDelete) return;
                  await deleteProduct({ id: productToDelete.id });
                }}
                disabled={isDeletingProduct}
              >
                Continue
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <h1 className="text-2xl font-bold">My Products</h1>
        {session?.user.id === id ? (
          <Button asChild>
            <Link href="/products/create">
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Link>
          </Button>
        ) : null}
      </div>
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products ? (
          products.map((product) => {
            const primeAsset = product.assets[0];
            const productLink = `/products/${product.id}`;
            return (
              <Card className="group border-border/50" key={product.id}>
                <CardContent>
                  <Link
                    href={productLink}
                    className="relative mb-4 block aspect-square h-auto w-full overflow-hidden rounded-md"
                  >
                    <img
                      src={primeAsset?.publicUrl}
                      alt={`An image of ${product.name}`}
                      className="h-full w-full object-cover transition group-hover:scale-105 group-hover:brightness-75 group-focus-visible:scale-105 group-focus-visible:brightness-75"
                    />
                  </Link>
                  <div>
                    <Link
                      className="inline text-lg font-medium hover:underline"
                      href={productLink}
                      tabIndex={-1}
                    >
                      {product.name}
                    </Link>
                    <p>${+product.price / 100}</p>
                  </div>
                </CardContent>
                {session?.user.id === product.userId ? (
                  <CardFooter className="flex justify-between">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/products/${product.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setProductToDelete(product)}
                      disabled={isDeletingProduct}
                    >
                      <Trash className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </CardFooter>
                ) : null}
              </Card>
            );
          })
        ) : (
          <>
            <Skeleton className="aspect-square h-auto w-full" />
            <Skeleton className="aspect-square h-auto w-full" />
            <Skeleton className="aspect-square h-auto w-full" />
          </>
        )}
      </div>
      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={data?.total}
        setPage={setPage}
        setPageSize={setPageSize}
      />
    </div>
  );
}

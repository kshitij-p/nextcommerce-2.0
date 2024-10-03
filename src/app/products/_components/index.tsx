/* eslint-disable @next/next/no-img-element */
"use client";

import { ProductCategory } from "@prisma/client";
import { Plus, Trash } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { MAX_PRODUCT_ASSET_SIZE, ONE_MB } from "~/constants";
import { useForm } from "~/hooks/use-form";
import { type SerializedProduct } from "~/server/services/product";
import { api } from "~/trpc/react";

const createProductSchema = z.object({
  name: z.string(),
  description: z.string(),
  price: z.number(),
  category: z.nativeEnum(ProductCategory),
  productDetails: z.string().array(),
  careDetails: z.string().array(),
  shippingReturns: z.string(),
  existingAssets: z
    .array(z.object({ key: z.string(), publicUrl: z.string() }))
    .max(5),
  filesToUpload: z
    .array(z.object({ file: z.instanceof(File), previewUrl: z.string() }))
    .max(5),
});

const categories = [
  {
    name: "Footwear",
    value: ProductCategory.FOOTWEAR,
  },
  {
    name: "Pants",
    value: ProductCategory.PANTS,
  },
  {
    name: "Shirts",
    value: ProductCategory.SHIRTS,
  },
  {
    name: "Tshirts",
    value: ProductCategory.TSHIRTS,
  },
  {
    name: "Jackets",
    value: ProductCategory.JACKETS,
  },
];

const MultiLineInput = ({
  onValueChange,
  value,
  max = 5,
}: {
  value: string[];
  onValueChange: (value: string[]) => void;
  max?: number;
}) => {
  return (
    <div className="flex max-w-xl flex-col gap-2">
      {value.map((item, idx) => {
        return (
          <div className="flex items-center gap-2" key={idx}>
            <Input
              value={item}
              onChange={(e) => {
                const newValue = e.currentTarget.value;
                onValueChange(
                  value.map((currValue, currIdx) => {
                    if (idx === currIdx) {
                      return newValue;
                    }
                    return currValue;
                  }),
                );
              }}
            />
            <Button
              type="button"
              onClick={() =>
                onValueChange(value.filter((_, currIdx) => currIdx !== idx))
              }
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
      <Button
        type="button"
        onClick={() => onValueChange([...value, ""])}
        disabled={value.length >= max}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};

const PreviewAsset = ({
  img,
  onDelete,
}: {
  img: string | undefined;
  onDelete: () => void;
}) => {
  return (
    <div className="group relative aspect-square h-auto w-80 min-w-60">
      <div className="absolute inset-0 left-1/2 top-1/2 z-10 h-max w-max -translate-x-1/2 -translate-y-1/2 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
        <Button variant={"outline"} type="button" onClick={onDelete}>
          <Trash />
          <p className="sr-only">Delete asset</p>
        </Button>
      </div>
      <img
        className="h-full w-full object-cover transition group-hover:brightness-50 group-focus-visible:brightness-50"
        src={img}
        alt="AA"
      />
    </div>
  );
};

const CreateUpdateProduct = ({ product }: { product?: SerializedProduct }) => {
  const router = useRouter();
  const { data: session } = useSession();

  const utils = api.useUtils();
  const { mutateAsync: createProduct, isPending: isCreatingProduct } =
    api.product.create.useMutation({
      onSuccess: async () => {
        toast.success("Created a product");

        const redirectLink = session
          ? `/account/${session.user.id}/products`
          : `/`;
        router.push(redirectLink);

        await utils.product.list.invalidate();
        await utils.product.get.invalidate();
      },
    });
  const { mutateAsync: editProduct, isPending: isEditingProduct } =
    api.product.edit.useMutation({
      onSuccess: async () => {
        toast.success("Updated the product");

        const redirectLink = session
          ? `/account/${session.user.id}/products`
          : `/`;
        router.push(redirectLink);

        await utils.product.list.invalidate();
        await utils.product.get.invalidate();
      },
    });
  const { mutateAsync: getPresignedUrl } =
    api.product.getUploadPresignedUrl.useMutation();

  const form = useForm({
    schema: createProductSchema,
    defaultValues: {
      name: product?.name ?? "",
      category: product?.category,
      description: product?.description ?? "",
      productDetails: product?.productDetails ?? [
        "100% pure silk",
        "Hand-embroidered detailing",
        "Concealed side zip",
        "Made in Italy",
      ],
      careDetails: product?.careDetails ?? [
        "Dry clean only",
        "Do not bleach",
        "Iron on low heat",
        "Store in a cool, dry place",
      ],
      shippingReturns:
        product?.shippingReturns ??
        "Free standard shipping on all orders. Express shipping available. Easy returns within 14 days. See our full policy for details.",
      price: product?.price ? Math.round(+product.price / 100) : undefined,
      filesToUpload: [],
      existingAssets: product?.assets ?? [],
    },
  });
  const filesToUpload = form.watch("filesToUpload");
  const existingAssets = form.watch("existingAssets");

  // const previewAssets = useMemo(() => {
  //   const assets = existingAssets.map((x) => x.publicUrl) ?? [];

  //   for (const file of filesToUpload) {
  //     assets.push(file.previewUrl);
  //   }
  //   return assets;
  // }, [filesToUpload, existingAssets]);
  const filePickerRef = useRef<HTMLInputElement>(null);

  return (
    <div className="container mx-auto">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(async ({ filesToUpload, ...values }) => {
            const assets: Array<{ key: string }> = existingAssets.map(
              (asset) => ({ key: asset.key }),
            );

            let newAssets;
            try {
              newAssets = await Promise.all(
                filesToUpload.map(async (uploadFile) => {
                  const { key, url } = await getPresignedUrl();
                  try {
                    const uploadResp = await fetch(url, {
                      method: "PUT",
                      body: uploadFile.file,
                      headers: new Headers({
                        "Content-Type": uploadFile.file.type,
                      }),
                    });
                    if (!uploadResp.ok) {
                      throw new Error(
                        `failed to upload file ${uploadFile.file.name}`,
                        { cause: uploadResp.statusText },
                      );
                    }
                  } catch (e) {
                    throw new Error(
                      `failed to upload file ${uploadFile.file.name}`,
                      { cause: e },
                    );
                  }
                  return { uploadFile, key };
                }),
              );
            } catch (e) {
              console.error("failed to upload some asset", e);
              toast.error("Failed to upload an asset. Please try again later.");
              return;
            }

            for (const asset of newAssets) {
              assets.push({
                key: asset.key,
              });
            }

            const data = {
              ...values,
              price: values.price * 100,
              assets,
            };
            if (product) {
              await editProduct({ ...data, id: product.id });
            } else {
              await createProduct(data);
            }
          })}
        >
          <div className="mx-auto flex max-w-4xl flex-col gap-8 p-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={() => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Price"
                      {...form.register("price", { valueAsNumber: true })}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write about your product"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((c) => {
                        return (
                          <SelectItem key={c.value} value={c.value}>
                            {c.name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="filesToUpload"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Images</FormLabel>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-4 overflow-x-auto">
                      {existingAssets.map((asset, idx) => {
                        return (
                          <PreviewAsset
                            key={asset.key}
                            img={asset.publicUrl}
                            onDelete={() => {
                              form.setValue(
                                "existingAssets",
                                form
                                  .getValues()
                                  .existingAssets.filter(
                                    (_, currIdx) => idx !== currIdx,
                                  ),
                              );
                            }}
                          />
                        );
                      })}
                      {filesToUpload.map((uploadFile, idx) => {
                        return (
                          <PreviewAsset
                            key={idx}
                            img={uploadFile.previewUrl}
                            onDelete={() => {
                              form.setValue(
                                "filesToUpload",
                                form
                                  .getValues()
                                  .filesToUpload.filter(
                                    (_, currIdx) => idx !== currIdx,
                                  ),
                              );
                            }}
                          />
                        );
                      })}
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        if (!filePickerRef.current) return;
                        filePickerRef.current.click();
                      }}
                    >
                      Attach Files
                    </Button>
                    <Input
                      className="sr-only"
                      ref={filePickerRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const files = e.currentTarget.files
                          ? Array.from(e.currentTarget.files)
                          : null;
                        e.currentTarget.value = "";

                        if (!files) {
                          field.onChange([]);
                          return;
                        }

                        if (
                          product &&
                          files.length +
                            form.getValues("existingAssets").length >
                            5
                        ) {
                          toast("Can't attach more than 5 images");
                          return;
                        }
                        for (const file of files) {
                          if (!file.type.startsWith("image")) {
                            toast("Only images are allowed");
                            return;
                          }

                          if (
                            file.size >
                            // 1 MB
                            MAX_PRODUCT_ASSET_SIZE
                          ) {
                            toast(
                              `Images larger than ${MAX_PRODUCT_ASSET_SIZE / ONE_MB}MB are not allowed`,
                            );
                            return;
                          }
                        }

                        field.onChange(
                          Array.from(files).map((file) => {
                            return {
                              file,
                              previewUrl: URL.createObjectURL(file),
                            };
                          }),
                        );
                      }}
                    />
                  </div>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Details</FormLabel>
                  <FormControl>
                    <MultiLineInput
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="careDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Care Details</FormLabel>
                  <FormControl>
                    <MultiLineInput
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shippingReturns"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping and returns Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Details about your shipping and returns policy for this product"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={
                isCreatingProduct ||
                isEditingProduct ||
                form.formState.isSubmitting
              }
            >
              {product ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CreateUpdateProduct;

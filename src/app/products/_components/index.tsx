/* eslint-disable @next/next/no-img-element */
"use client";

import { ProductCategory } from "@prisma/client";
import { Plus, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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

type UploadFile = {
  file: File;
  previewUrl: string;
};

const CreateUpdateProduct = ({ product }: { product?: SerializedProduct }) => {
  const router = useRouter();

  const utils = api.useUtils();
  const { mutateAsync: createProduct, isPending: isCreatingProduct } =
    api.product.create.useMutation({
      onSuccess: async () => {
        toast.success("Created a product");

        router.push("/products");

        await utils.product.list.invalidate();
        await utils.product.get.invalidate();
      },
    });

  const [filesToUpload, setFilesToUpload] = useState<UploadFile[]>([]);

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
      price: product?.price ? +product.price : undefined,
    },
  });

  const previewAssets = useMemo(() => {
    return filesToUpload.map(({ previewUrl }) => previewUrl);
  }, [filesToUpload]);

  console.log(filesToUpload);

  return (
    <div className="container mx-auto">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(async (values) => {
            await createProduct({
              ...values,
              price: values.price * 100,
              assets: [],
            });
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
            <div className="flex flex-col gap-2">
              <div className="flex gap-4 overflow-x-auto">
                {previewAssets.map((previewUrl, idx) => {
                  return (
                    <div
                      className="aspect-square h-auto w-80 min-w-60"
                      key={idx}
                    >
                      <img
                        className="h-full w-full object-cover"
                        src={previewUrl}
                        alt="AA"
                      />
                    </div>
                  );
                })}
              </div>
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = e.currentTarget.files;
                  if (!files) {
                    setFilesToUpload([]);
                    return;
                  }
                  setFilesToUpload(
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
            <Button type="submit" disabled={isCreatingProduct}>
              {product ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CreateUpdateProduct;

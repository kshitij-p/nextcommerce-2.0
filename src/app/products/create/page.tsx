"use client";

import { ProductCategory } from "@prisma/client";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { useForm } from "~/hooks/use-form";
import { api } from "~/trpc/react";

const createProductSchema = z.object({
  name: z.string(),
  price: z.number(),
  category: z.nativeEnum(ProductCategory),
  assets: z.array(z.object({ key: z.string() })),
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

const CreateProductPage = () => {
  const router = useRouter();

  const utils = api.useUtils();
  const { mutateAsync: createProduct } = api.product.create.useMutation({
    onSuccess: async () => {
      alert("DONE!");

      router.push("/products");

      await utils.product.list.invalidate();
      await utils.product.get.invalidate();
    },
  });

  const form = useForm({
    schema: createProductSchema,
    defaultValues: {
      assets: [],
      name: "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          await createProduct({ ...values, price: values.price * 100 });
        })}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Name" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
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
              <FormDescription>
                This is your public display price.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a verified email to display" />
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
        <Button type="submit">Create</Button>
      </form>
    </Form>
  );
};

export default CreateProductPage;

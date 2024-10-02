import { type TypeOf, z } from "zod";
import { type Product, type Prisma } from "@prisma/client";
import { db } from "../db";

export type SerializedProduct = Omit<Product, "price"> & {
  price: string;
};

export const listProductsDto = z.object({
  name: z.string().optional(),
  skip: z.coerce.number().default(0),
  take: z.coerce.number().default(10),
});

const listProducts = async ({
  name,
  skip,
  take,
}: TypeOf<typeof listProductsDto>) => {
  const filters: Prisma.ProductWhereInput = {
    name: name
      ? {
          contains: name,
          mode: "insensitive",
        }
      : undefined,
  };

  const [products, count] = await Promise.all([
    db.product.findMany({
      where: filters,
      skip,
      take,
    }),
    db.product.count({ where: filters }),
  ]);

  return {
    items: products as unknown as SerializedProduct[],
    total: count,
  };
};

export const getProductDto = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
});
const getProduct = async ({ id, name }: TypeOf<typeof getProductDto>) => {
  const product = await db.product.findFirst({
    where: {
      id,
      name,
    },
  });

  return {
    item: product as unknown as SerializedProduct,
  };
};

export const productService = {
  list: listProducts,
  get: getProduct,
};

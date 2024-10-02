import { type TypeOf, z } from "zod";
import {
  type Product,
  type Prisma,
  type ProductAsset,
  ProductCategory,
} from "@prisma/client";
import { db } from "../db";

export type SerializedProduct = Omit<Product, "price"> & {
  price: string;
  assets: ProductAsset[];
};

export const listProductsDto = z.object({
  name: z.string().optional(),
  priceLte: z.number().optional(),
  priceGte: z.number().optional(),
  categories: z.array(z.nativeEnum(ProductCategory)).optional(),
  skip: z.coerce.number().default(0),
  take: z.coerce.number().default(10),
});

const listProducts = async ({
  name,
  categories,
  priceGte,
  priceLte,
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
    price:
      priceLte !== undefined || priceGte !== undefined
        ? {
            gte: priceGte,
            lte: priceLte,
          }
        : undefined,
    category: categories?.length
      ? {
          in: categories,
        }
      : undefined,
  };

  const [products, count] = await Promise.all([
    db.product.findMany({
      where: filters,
      skip,
      take,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      include: {
        assets: true,
      },
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
    include: {
      assets: true,
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

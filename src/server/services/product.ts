import { type TypeOf, z } from "zod";
import {
  type Product,
  type Prisma,
  type ProductAsset,
  ProductCategory,
  PaymentStatus,
} from "@prisma/client";
import { db } from "../db";
import { stripe } from "./stripe";
import { TRPCError } from "@trpc/server";

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
    deleted: false,
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
      deleted: false,
    },
    include: {
      assets: true,
    },
  });

  return {
    item: product as unknown as SerializedProduct,
  };
};

export const createProductDto = z.object({
  name: z.string(),
  price: z.number(),
  category: z.nativeEnum(ProductCategory),
  assets: z.array(z.object({ key: z.string() })),
  productDetails: z.string().array(),
  careDetails: z.string().array(),
  shippingReturns: z.string(),
  description: z.string(),
});
export const createProduct = async (
  { name, assets, price, ...data }: TypeOf<typeof createProductDto>,
  userId: string,
) => {
  const stripeProduct = await stripe.products.create({
    name,
    default_price_data: {
      currency: "USD",
      unit_amount: price,
    },
  });

  const priceId =
    typeof stripeProduct.default_price === "string"
      ? stripeProduct.default_price
      : stripeProduct.default_price?.id;

  if (!priceId)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      cause: `failed to get price id after creating product ${stripeProduct.id}, got price id ${priceId}`,
    });

  const product = await db.product.create({
    data: {
      ...data,
      name,
      price,
      stripeId: stripeProduct.id,
      stripePriceId: priceId,
      userId,
      assets: {
        createMany: {
          data: assets.map(({ key }) => {
            return {
              key,
              // TODO: update the prefix
              publicUrl: `https://pub-052bc15d6b604762ae76f9b3a603d345.r2.dev/${key}`,
            };
          }),
        },
      },
    },
  });

  return product;
};

export const deleteProductDto = z.object({
  id: z.string(),
});
export const deleteProduct = async (
  { id }: TypeOf<typeof deleteProductDto>,
  userId: string,
) => {
  const product = await db.$transaction(async (tx) => {
    await tx.payment.updateMany({
      where: {
        items: {
          some: {
            productId: id,
          },
        },
        status: PaymentStatus.PENDING,
      },
      data: {
        expiresAt: null,
        status: PaymentStatus.EXPIRED,
      },
    });
    await tx.cartItem.deleteMany({
      where: {
        productId: id,
      },
    });
    await tx.productAsset.deleteMany({
      where: {
        productId: id,
      },
    });
    return await tx.product.update({
      where: {
        id,
        userId,
      },
      data: {
        deleted: true,
        deletedAt: new Date(),
      },
    });
  });
  if (!product) throw new TRPCError({ code: "NOT_FOUND" });

  return product;
};

export const productService = {
  list: listProducts,
  get: getProduct,
  create: createProduct,
  delete: deleteProduct,
};

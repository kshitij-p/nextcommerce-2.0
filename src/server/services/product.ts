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
import { s3 } from "./s3";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "~/env";
import { cuid } from "./cuid";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

  if (!product) throw new TRPCError({ code: "NOT_FOUND" });

  return {
    item: product as unknown as SerializedProduct,
  };
};

const MIN_PRICE = 50;
const MAX_ASSETS = 5;
const MAX_PRODUCT_DETAILS = 5;
const MAX_CARE_DETAILS = 5;

export const createProductDto = z.object({
  name: z.string(),
  price: z.number().min(MIN_PRICE),
  category: z.nativeEnum(ProductCategory),
  assets: z.array(z.object({ key: z.string() })).max(MAX_ASSETS),
  productDetails: z.string().array().max(MAX_PRODUCT_DETAILS),
  careDetails: z.string().array().max(MAX_CARE_DETAILS),
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
              publicUrl: `${env.R2_PUBLIC_URL_PREFIX}/${key}`,
            };
          }),
        },
      },
    },
  });

  return product;
};

const s3SafeBulkDelete = async (keys: string[]) => {
  try {
    const deleteRes = await Promise.allSettled(
      keys.map(async (key) => {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: env.R2_BUCKET,
            Key: key,
          }),
        );
      }),
    );
    for (const item of deleteRes) {
      if (item.status === "rejected") {
        console.error(
          `failed to delete an asset asset ${item.status} ${item.reason}`,
        );
      }
    }
  } catch (e) {
    console.error("failed to delete some assets", e);
  }
};

export const editProductDto = z.object({
  id: z.string(),
  name: z.string().optional(),
  price: z.number().min(MIN_PRICE).optional(),
  category: z.nativeEnum(ProductCategory),
  assets: z
    .array(z.object({ key: z.string() }))
    .max(MAX_ASSETS)
    .optional(),
  productDetails: z.string().array().max(MAX_PRODUCT_DETAILS).optional(),
  careDetails: z.string().array().max(MAX_CARE_DETAILS).optional(),
  shippingReturns: z.string().optional(),
  description: z.string().optional(),
});
export const editProduct = async (
  { id, name, assets, price, ...data }: TypeOf<typeof editProductDto>,
  userId: string,
) => {
  let product = await db.product.findFirst({ where: { id } });
  if (!product) throw new TRPCError({ code: "NOT_FOUND" });
  if (product.userId !== userId) throw new TRPCError({ code: "FORBIDDEN" });

  let newStripePriceId;
  const oldStripePriceId = product.stripePriceId;

  if (price && !product.price.equals(price)) {
    const newPrice = await stripe.prices.create({
      currency: "USD",
      unit_amount: price,
      product: product.stripeId,
    });
    newStripePriceId = newPrice.id;
  }

  if (name || newStripePriceId) {
    await stripe.products.update(product.stripeId, {
      default_price: newStripePriceId,
      name,
    });
  }

  if (newStripePriceId) {
    try {
      await stripe.prices.update(oldStripePriceId, { active: false });
    } catch (e) {
      console.error(
        `failed to deactive old stripe price ${oldStripePriceId}`,
        e,
      );
    }
  }

  let assetsToRemove;
  if (assets) {
    assetsToRemove = await db.productAsset.findMany({
      where: {
        productId: id,
        key: {
          notIn: assets.map(({ key }) => key),
        },
      },
      select: {
        key: true,
      },
    });
  }
  await db.$transaction(async (tx) => {
    if (assets) {
      await tx.productAsset.deleteMany({
        where: {
          productId: id,
        },
      });
    }
    product = await db.product.update({
      where: {
        id,
      },
      data: {
        ...data,
        name,
        price,
        assets: assets
          ? {
              createMany: {
                data: assets.map(({ key }) => {
                  return {
                    key,
                    publicUrl: `${env.R2_PUBLIC_URL_PREFIX}/${key}`,
                  };
                }),
              },
            }
          : undefined,
      },
    });
  });
  if (assetsToRemove) {
    await s3SafeBulkDelete(assetsToRemove.map((asset) => asset.key));
  }

  return product;
};

export const deleteProductDto = z.object({
  id: z.string(),
});
export const deleteProduct = async (
  { id }: TypeOf<typeof deleteProductDto>,
  userId: string,
) => {
  const assets = await db.productAsset.findMany({
    where: {
      productId: id,
    },
  });
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
    const res = await tx.product.update({
      where: {
        id,
        userId,
      },
      data: {
        deleted: true,
        deletedAt: new Date(),
      },
    });
    if (!res) throw new TRPCError({ code: "NOT_FOUND" });
    return res;
  });

  await s3SafeBulkDelete(assets.map((asset) => asset.key));

  return product;
};

export const getUploadPresignedUrl = async (userId: string) => {
  const key = `${userId}/${cuid()}`;
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
    ACL: "public-read",
  });
  const url = await getSignedUrl(s3, command, {
    expiresIn: 60,
  });
  return { url, key };
};

export const productService = {
  list: listProducts,
  get: getProduct,
  create: createProduct,
  edit: editProduct,
  delete: deleteProduct,
  getUploadPresignedUrl,
};

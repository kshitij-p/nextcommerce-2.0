import { type Metadata, type ResolvingMetadata } from "next";
import ProductDetailsPage from "../_components/product-details-page";
import { api } from "~/trpc/server";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Record<string, string | string[] | undefined>;
};

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const params = await props.params;
  // read route params
  const id = params.id;

  // fetch data
  try {
    const { item: product } = await api.product.get({ id });

    const previousImages = (await parent).openGraph?.images ?? [];

    return {
      title: product.name,
      openGraph: {
        images: [
          ...product.assets.map((asset) => asset.publicUrl),
          ...previousImages,
        ],
      },
      description: product.description,
    };
  } catch {
    return {
      title: "Nextcommerce",
      description: "An ecommerce marketplace site built with NextJs",
    };
  }
}

export const revalidate = 60;
export const dynamicParams = true;

export default async function Page(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;

  const {
    id
  } = params;

  await api.product.get.prefetch({ id });

  return <ProductDetailsPage />;
}

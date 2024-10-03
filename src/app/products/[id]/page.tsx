import { type Metadata, type ResolvingMetadata } from "next";
import ProductDetailsPage from "../_components/product-details-page";
import { api } from "~/trpc/server";

type Props = {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
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

export default function Page() {
  return <ProductDetailsPage />;
}

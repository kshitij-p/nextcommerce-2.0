import { Suspense } from "react";
import ProductsPage from "../_components/products-page";

export const metadata = {
  title: "Products",
  description: "View sleek, elegant fashion products",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function Page() {
  return (
    <Suspense>
      <ProductsPage />
    </Suspense>
  );
}

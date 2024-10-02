/* eslint-disable @next/next/no-img-element */
// "use client";

// import { MAX_STALE_TIME } from "~/constants";
// import { api } from "~/trpc/react";

// const ProductPage = () => {
//   const { data } = api.product.list.useQuery(
//     {},
//     {
//       staleTime: MAX_STALE_TIME,
//     },
//   );

//   return (
//     <div>
//       <h2>Products</h2>
//       <ul>
//         {data?.items.map((product) => {
//           return (
//             <a href={`/products/${product.id}`} key={product.id}>
//               {product.name} ${product.price.toString()}
//             </a>
//           );
//         })}
//       </ul>
//     </div>
//   );
// };

// export default ProductPage;
"use client";
import React, { useMemo, useState } from "react";
import { Search, Sliders, ShoppingBag } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Slider, SliderThumb } from "~/components/ui/slider";
import { Checkbox } from "~/components/ui/checkbox";
import { api } from "~/trpc/react";
import { MAX_STALE_TIME } from "~/constants";
import Link from "next/link";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import useDebounced from "~/hooks/use-debounced";
import { ProductCategory } from "@prisma/client";

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

type ProductFilters = {
  price: [number, number];
  name: string;
  categories: string[];
};

const MAX_PRICE = 510_000;

const Filters = ({
  filters,
  setFilters,
}: {
  filters: ProductFilters;
  setFilters: React.Dispatch<React.SetStateAction<ProductFilters>>;
}) => {
  const { price, categories: selectedCategories } = filters;
  const formattedPriceRange = useMemo(() => {
    let [startPrice, endPrice] = price;

    startPrice = Math.round(startPrice / 100);
    endPrice = Math.round(endPrice / 100);

    return `$${startPrice} - $${endPrice >= MAX_PRICE ? "5000+" : endPrice}`;
  }, [price]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-start text-lg">Category</h3>
        <div className="space-y-2">
          {categories.map((c) => {
            const id = `filter-category-check-${c.value}`;
            return (
              <div className="flex items-center" key={c.name}>
                <Checkbox
                  id={id}
                  checked={selectedCategories.includes(c.value)}
                  onCheckedChange={(val) =>
                    setFilters((filters) => ({
                      ...filters,
                      categories: val
                        ? [...selectedCategories, c.value]
                        : selectedCategories.filter((curr) => curr !== c.value),
                    }))
                  }
                />
                <label className="ml-2" htmlFor={id}>
                  {c.name}
                </label>
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <div className="mb-2 flex flex-col">
          <span className="flex items-center gap-2">
            <h3>
              <span className="text-lg">Price</span>
            </h3>
            <span>{formattedPriceRange}</span>
          </span>
        </div>
        <Slider
          value={price}
          onValueChange={(val) =>
            setFilters((curr) => ({
              ...curr,
              price: val as [number, number],
            }))
          }
          step={5000}
          min={0}
          max={MAX_PRICE}
        >
          <SliderThumb />
        </Slider>
        <div className="mt-2 flex justify-between text-sm">
          <span>$0</span>
          <span>$5000+</span>
        </div>
      </div>
    </div>
  );
};

export default function ProductListing() {
  const [filters, setFilters] = useState<ProductFilters>({
    price: [0, MAX_PRICE] as [number, number],
    name: "",
    categories: [],
  });
  const debouncedFilters = useDebounced(filters, 250);

  const { data, isLoading: isLoadingProducts } = api.product.list.useQuery(
    {
      name: debouncedFilters.name,
      priceGte: debouncedFilters.price[0]
        ? debouncedFilters.price[0]
        : undefined,
      priceLte:
        debouncedFilters.price[1] >= MAX_PRICE
          ? undefined
          : debouncedFilters.price[1],
      categories: debouncedFilters.categories as ProductCategory[],
    },
    {
      staleTime: MAX_STALE_TIME,
    },
  );
  const products = data?.items ?? [];

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-10 border-b border-gray-800 bg-gray-900">
        <div className="mx-auto flex w-full items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold">LUXE NOIR</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                type="search"
                placeholder="Search products..."
                className="w-64 border-gray-700 bg-gray-800 py-2 pl-10 pr-4 focus:border-gray-600"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <Button variant="ghost" size="icon">
              <ShoppingBag className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full px-4 pb-8">
        <aside className="sticky inset-0 mr-8 hidden w-64 pt-8 md:block">
          <div className="sticky top-20">
            <h2 className="mb-4 flex items-center text-xl font-semibold">
              Filters
            </h2>
            <Filters filters={filters} setFilters={setFilters} />
          </div>
        </aside>

        <div className="flex flex-1 flex-col gap-8 pt-8">
          <div className="w-full">
            <label className="mb-1 inline-block" htmlFor="products-name-search">
              Search
            </label>
            <div className="flex w-full items-center gap-4">
              <Input
                className="w-full max-w-[700px]"
                id="products-name-search"
                type="search"
                value={filters.name}
                onChange={(e) => {
                  const value = e.currentTarget.value;
                  setFilters((curr) => ({
                    ...curr,
                    name: value,
                  }));
                }}
              />
              <Drawer>
                <DrawerTrigger className="flex items-center justify-center md:hidden">
                  <Sliders className="h-5 w-5" />
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle className="text-center">Filters</DrawerTitle>
                    <div>
                      <Filters filters={filters} setFilters={setFilters} />
                    </div>
                  </DrawerHeader>
                </DrawerContent>
              </Drawer>
            </div>
          </div>
          {products.length ? (
            <div className="grid grid-cols-3 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => {
                const image = `https://pub-052bc15d6b604762ae76f9b3a603d345.r2.dev/${product.assets[0]?.key}`;
                const productLink = `/products/${product.id}`;
                return (
                  <div key={product.id} className="group">
                    <Link
                      href={productLink}
                      className="inline-block aspect-[3/5] w-full overflow-hidden rounded-lg bg-gray-900"
                    >
                      <img
                        className="h-full w-full overflow-hidden object-cover object-center transition duration-300 group-hover:scale-105 group-hover:opacity-75"
                        src={image}
                        alt={product.name}
                      />
                    </Link>
                    <div className="leading-none">
                      <Link
                        href={productLink}
                        className="text-lg font-medium hover:underline"
                      >
                        {product.name}
                      </Link>
                      <p className="font-semibold leading-none">
                        ${Math.round(+product.price / 100)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              {isLoadingProducts ? "Loading..." : "No products available"}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useMemo } from "react";
import { Sliders } from "lucide-react";
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
import { Skeleton } from "~/components/ui/skeleton";
import { PaginationControls } from "~/components/pagination-controls";
import { usePagination } from "~/hooks/use-pagination";
import { Image } from "~/components/ui/image";
import { imageAlts } from "~/lib/image-alt";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  type ParserBuilder,
  useQueryState,
} from "nuqs";

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
  setPrice,
  setCategories,
}: {
  filters: ProductFilters;
  setPrice: (val: [number, number]) => void;
  setName: (val: string) => void;
  setCategories: (val: string[]) => void;
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
                    setCategories(
                      val
                        ? [...selectedCategories, c.value]
                        : selectedCategories.filter((curr) => curr !== c.value),
                    )
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
          onValueChange={(val: [number, number]) => setPrice(val)}
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

const productSkeletons = new Array(5).fill(undefined).map((_, idx) => (
  <div className="space-y-2" key={idx}>
    <div className="aspect-[3/5] w-full">
      <Skeleton className="h-full w-full" />
    </div>
    <div className="space-y-1">
      <Skeleton className="h-6 w-full max-w-48" />
      <Skeleton className="h-5 w-full max-w-24" />
    </div>
  </div>
));

export default function HomePage() {
  const [price, setPrice] = useQueryState<[number, number]>(
    "price",
    parseAsArrayOf(parseAsInteger).withDefault([
      0,
      MAX_PRICE,
    ]) as unknown as ParserBuilder<[number, number]> & {
      readonly defaultValue: [number, number];
    },
  );

  const [name, setName] = useQueryState("name", parseAsString.withDefault(""));
  const [categories, setCategories] = useQueryState(
    "categories",
    parseAsArrayOf(parseAsString).withDefault([]),
  );

  const filters = { categories, name, price } satisfies ProductFilters;
  const debouncedFilters = useDebounced(filters, 250);

  const { skip, take, pageSize, setPageSize, page, setPage } = usePagination();
  const { data, isError: isGettingProductsError } = api.product.list.useQuery(
    {
      skip,
      take,
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
  const products = data?.items;

  return (
    <div>
      <div className="mx-auto flex w-full px-4 pb-8">
        <aside className="sticky inset-0 mr-8 hidden w-64 pt-8 md:block">
          <div className="sticky top-20">
            <h2 className="mb-4 flex items-center text-xl font-semibold">
              Filters
            </h2>
            <Filters
              filters={filters}
              setPrice={setPrice}
              setCategories={setCategories}
              setName={setName}
            />
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
                  void setName(value);
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
                      <Filters
                        filters={filters}
                        setPrice={setPrice}
                        setCategories={setCategories}
                        setName={setName}
                      />
                    </div>
                  </DrawerHeader>
                </DrawerContent>
              </Drawer>
            </div>
          </div>
          {products ? (
            products.length ? (
              <div className="grid grid-cols-3 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => {
                  const productLink = `/products/${product.id}`;
                  return (
                    <div key={product.id} className="group">
                      <Link
                        href={productLink}
                        className="inline-block aspect-[3/5] w-full overflow-hidden rounded-lg bg-gray-900"
                      >
                        <Image
                          className="h-full w-full overflow-hidden object-cover object-center transition duration-300 group-hover:scale-105 group-hover:brightness-75 group-focus-visible:scale-105 group-focus-visible:brightness-75"
                          src={product.assets[0]?.publicUrl}
                          alt={imageAlts.product(product)}
                        />
                      </Link>
                      <div className="space-y-1">
                        <Link
                          href={productLink}
                          className="text-lg font-medium leading-none hover:underline"
                        >
                          {product.name}
                        </Link>
                        <p className="font-semibold leading-none">
                          ${+product.price / 100}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full min-h-[55vh] w-full items-center justify-center">
                No products match the given filters.
              </div>
            )
          ) : isGettingProductsError ? (
            <div className="flex h-full min-h-[55vh] w-full items-center justify-center">
              Failed to get products.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {productSkeletons}
            </div>
          )}
          <PaginationControls
            page={page}
            pageSize={pageSize}
            total={data?.total}
            setPage={setPage}
            setPageSize={setPageSize}
          />
        </div>
      </div>
    </div>
  );
}

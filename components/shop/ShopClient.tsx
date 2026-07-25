"use client";

import { useMemo, useState } from "react";
import { Product } from "@/data/products";
import { Category } from "@/data/categories";
import ProductCard from "@/components/ProductCard";

interface ShopClientProps {
  products: Product[];
  categories: Category[];
  selectedCategory?: string;
}

export default function ShopClient({
  products,
  categories,
  selectedCategory = "All",
}: ShopClientProps) {
  const [activeCategory, setActiveCategory] = useState(
    selectedCategory || "All"
  );

  const filteredProducts = useMemo(() => {
    if (activeCategory === "All") {
      return products;
    }

    return products.filter((product) => product.category === activeCategory);
  }, [activeCategory, products]);

  return (
    <section className="bg-[#FFFAF3] px-6 py-16 md:px-12">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#B87333]">
          Shop
        </p>

        <h1 className="font-heading mt-4 text-5xl font-semibold text-stone-950">
          Explore Products
        </h1>

        <p className="mt-5 max-w-2xl text-stone-600">
          Browse Adams Elite collections by category.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <button
            onClick={() => setActiveCategory("All")}
            className={`rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition ${
              activeCategory === "All"
                ? "bg-stone-950 text-white"
                : "border border-[#B87333]/20 bg-white/70 text-stone-700 hover:bg-[#B87333] hover:text-white"
            }`}
          >
            All
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.name)}
              className={`rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                activeCategory === category.name
                  ? "bg-stone-950 text-white"
                  : "border border-[#B87333]/20 bg-white/70 text-stone-700 hover:bg-[#B87333] hover:text-white"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="mt-10">
          {filteredProducts.length === 0 ? (
            <div className="rounded-[34px] bg-white/70 p-12 text-center shadow-sm">
              <h2 className="font-heading text-3xl font-semibold text-stone-950">
                No products found
              </h2>

              <p className="mt-3 text-stone-600">
                Products added to this category will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
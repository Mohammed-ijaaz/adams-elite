import { getFeaturedProducts } from "@/lib/products";
import ProductCard from "./ProductCard";

export default async function FeaturedProducts() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <section className="bg-[#F7F1E8] px-6 py-24 md:px-12">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[#B87333]">
          Featured Products
        </p>

        <div className="mt-4 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-heading text-5xl font-semibold text-stone-950">
              New Arrivals
            </h2>

            <p className="mt-5 max-w-2xl leading-8 text-stone-600">
              Handpicked pieces from our latest jewellery, fragrance and fashion
              accessory collections.
            </p>
          </div>

          <a
            href="/shop"
            className="inline-flex min-w-[170px] items-center justify-center rounded-full border border-stone-950 px-10 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-stone-950 transition hover:bg-stone-950 hover:text-white"
          >
            View All
          </a>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
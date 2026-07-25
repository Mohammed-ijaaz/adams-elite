import Image from "next/image";
import Link from "next/link";
import { getCategories } from "@/lib/categories";

const categoryImageMap: Record<string, string> = {
  "Fashion Jewellery": "/images/categories/fashion.jpeg",
  "Bridal Collection": "/images/categories/bridal.jpeg",
  "Rental Jewellery": "/images/categories/rentals.jpeg",
  Perfumes: "/images/categories/perfumes.jpeg",
  Handbags: "/images/categories/handbags.jpeg",
  Footwear: "/images/categories/footwear.jpeg",
  Footware: "/images/categories/footwear.jpeg",
};

function getCategoryImage(categoryName: string, uploadedImage: string) {
  if (uploadedImage) return uploadedImage;

  return categoryImageMap[categoryName] || "/images/categories/fashion.jpeg";
}

export default async function Categories() {
  const categories = await getCategories();

  return (
    <section className="bg-[#FFFAF3] px-6 py-20 md:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#B87333]">
              Shop by Category
            </p>

            <h2 className="font-heading mt-4 text-5xl font-semibold text-stone-950">
              Explore Adams Elite
            </h2>
          </div>

          <Link
            href="/shop"
            className="w-fit rounded-full border border-stone-950 px-8 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-stone-950 transition hover:bg-stone-950 hover:text-white"
          >
            View All
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/shop?category=${encodeURIComponent(category.name)}`}
              className="group overflow-hidden rounded-[42px] bg-white/70 p-3 shadow-sm ring-1 ring-[#B87333]/10 backdrop-blur transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative h-80 overflow-hidden rounded-[34px] bg-stone-100">
                <Image
                  src={getCategoryImage(category.name, category.image)}
                  alt={category.name}
                  fill
                  unoptimized
                  className="object-cover transition duration-700 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                <div className="absolute bottom-6 left-6 right-6">
                  <h3 className="font-heading text-3xl font-semibold text-white">
                    {category.name}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
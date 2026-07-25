import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProductActions from "@/components/product/ProductActions";
import ProductImageSlider from "@/components/product/ProductImageSlider";
import { getProductById, getProducts } from "@/lib/products";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const product = await getProductById(Number(resolvedParams.id));

  if (!product) {
    notFound();
  }

  const isOutOfStock = product.stockQuantity <= 0;

  const allProducts = await getProducts();
  const relatedProducts = allProducts
    .filter(
      (item) => item.category === product.category && item.id !== product.id
    )
    .slice(0, 4);

  return (
    <main>
      <Navbar />

      <section className="bg-[#FFFAF3] px-6 py-16 md:px-12">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
          <div className="relative min-h-[520px] overflow-hidden rounded-[42px] bg-stone-100 shadow-[0_24px_80px_rgba(0,0,0,0.12)]">
            <ProductImageSlider
              images={product.images}
              alt={product.name}
              showControls
              className="h-full min-h-[520px] w-full"
            />

            {product.rentalAvailable && (
              <div className="absolute left-6 top-6 z-20 rounded-full bg-[#B87333] px-5 py-3 text-xs font-semibold uppercase tracking-widest text-white">
                Available for Rental
              </div>
            )}

            {isOutOfStock && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55">
                <span className="rounded-full bg-white px-6 py-4 text-sm font-semibold uppercase tracking-widest text-stone-950">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-sm font-medium uppercase tracking-[0.35em] text-[#B87333]">
              {product.category}
            </p>

            <h1 className="font-heading mt-5 text-5xl font-semibold text-stone-950">
              {product.name}
            </h1>

            <p className="mt-5 text-3xl font-semibold text-stone-950">
              ₹{product.price}
            </p>

            <p
              className={`mt-3 text-lg font-medium ${
                isOutOfStock ? "text-red-600" : "text-green-700"
              }`}
            >
              {isOutOfStock
                ? "Out of stock"
                : `Available Quantity: ${product.stockQuantity}`}
            </p>

            <p className="mt-2 text-sm text-stone-500">
              GST {product.gstPercent}% included
            </p>

            {(product.footwearSize || product.footwearColour) && (
              <div className="mt-5 grid max-w-md grid-cols-2 gap-4">
                {product.footwearSize && (
                  <div className="rounded-2xl bg-white/70 p-4">
                    <p className="text-xs uppercase tracking-widest text-stone-500">
                      Size
                    </p>
                    <p className="mt-1 text-lg font-semibold text-stone-950">
                      {product.footwearSize}
                    </p>
                  </div>
                )}

                {product.footwearColour && (
                  <div className="rounded-2xl bg-white/70 p-4">
                    <p className="text-xs uppercase tracking-widest text-stone-500">
                      Colour
                    </p>
                    <p className="mt-1 text-lg font-semibold text-stone-950">
                      {product.footwearColour}
                    </p>
                  </div>
                )}
              </div>
            )}

            {product.rentalAvailable && product.rentalPrice && (
              <p className="mt-3 text-xl font-medium text-[#B87333]">
                Rental Price: ₹{product.rentalPrice}
              </p>
            )}

            {product.rentalAvailable && product.advanceAmount && (
              <p className="mt-2 text-lg font-medium text-stone-700">
                Advance Amount: ₹{product.advanceAmount}
              </p>
            )}

            <p className="mt-6 max-w-xl leading-8 text-stone-600">
              {product.description ||
                "A premium Adams Elite product crafted for elegance, occasions, gifting and everyday styling."}
            </p>

            <ProductActions product={product} />

            <div className="mt-10 rounded-[30px] bg-[#F7F1E8] p-6">
              <h2 className="text-xl font-semibold text-stone-950">
                Product Details
              </h2>

              <ul className="mt-4 space-y-3 text-sm text-stone-600">
                <li>Category: {product.category}</li>
                <li>Store price: ₹{product.price}</li>
                <li>Available quantity: {product.stockQuantity}</li>
                <li>GST included: {product.gstPercent}%</li>

                {product.footwearSize && <li>Size: {product.footwearSize}</li>}

                {product.footwearColour && (
                  <li>Colour: {product.footwearColour}</li>
                )}

                {product.rentalAvailable && (
                  <li>
                    Rental available
                    {product.rentalPrice ? `: ₹${product.rentalPrice}` : ""}
                  </li>
                )}

                {product.rentalAvailable && product.advanceAmount && (
                  <li>Advance amount: ₹{product.advanceAmount}</li>
                )}

                <li>Contact us for stock confirmation</li>
              </ul>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mx-auto mt-20 max-w-7xl">
            <h2 className="font-heading text-3xl font-semibold text-stone-950">
              You May Also Like
            </h2>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((item) => (
                <Link
                  key={item.id}
                  href={`/product/${item.id}`}
                  className="group overflow-hidden rounded-[34px] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-64 overflow-hidden rounded-[30px] bg-stone-100">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      unoptimized
                      className="object-cover transition duration-500 group-hover:scale-110"
                    />
                  </div>

                  <div className="p-5">
                    <p className="text-sm text-[#B87333]">{item.category}</p>

                    <h3 className="mt-2 font-semibold text-stone-950">
                      {item.name}
                    </h3>

                    <p className="mt-2 text-stone-600">₹{item.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
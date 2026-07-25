import Link from "next/link";
import { Product } from "@/data/products";
import ProductImageSlider from "@/components/product/ProductImageSlider";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const isOutOfStock = product.stockQuantity <= 0;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-[48px] bg-white/70 p-3 shadow-sm ring-1 ring-[#B87333]/10 backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl">
      <div className="relative h-80 shrink-0 overflow-hidden rounded-[40px] bg-stone-100">
        <ProductImageSlider
          images={product.images}
          alt={product.name}
          autoPlay
          className="h-full w-full"
        />

        {product.rentalAvailable && (
          <div className="absolute left-5 top-5 z-20 rounded-full bg-[#B87333] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-lg">
            Rental
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55">
            <span className="rounded-full bg-white px-5 py-3 text-xs font-semibold uppercase tracking-widest text-stone-950">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#B87333]">
          {product.category}
        </p>

        <h3 className="font-heading mt-3 min-h-[64px] text-2xl font-semibold leading-tight text-stone-950">
          {product.name}
        </h3>

        <p className="mt-3 text-lg font-medium text-stone-700">
          ₹{product.price}
        </p>

        <p
          className={`mt-1 text-sm ${
            isOutOfStock ? "text-red-600" : "text-stone-500"
          }`}
        >
          {isOutOfStock
            ? "Out of stock"
            : `Available Qty: ${product.stockQuantity}`}
        </p>

        <div className="mt-1 min-h-[44px]">
          {product.rentalAvailable && product.rentalPrice && (
            <p className="text-sm text-stone-500">
              Rental: ₹{product.rentalPrice}
            </p>
          )}

          {product.rentalAvailable && product.advanceAmount && (
            <p className="mt-1 text-sm text-stone-500">
              Advance: ₹{product.advanceAmount}
            </p>
          )}
        </div>

        <Link
          href={`/product/${product.id}`}
          className="mt-auto block w-full rounded-full bg-stone-950 px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-[#B87333]"
        >
          View Product
        </Link>
      </div>
    </div>
  );
}
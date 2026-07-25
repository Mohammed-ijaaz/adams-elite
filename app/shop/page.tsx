import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ShopClient from "@/components/shop/ShopClient";
import { getCategories } from "@/lib/categories";
import { getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
  }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const resolvedSearchParams = await searchParams;

  const products = await getProducts();
  const categories = await getCategories();

  const selectedCategory = resolvedSearchParams.category
    ? decodeURIComponent(resolvedSearchParams.category)
    : "All";

  return (
    <main>
      <Navbar />
      <ShopClient
        products={products}
        categories={categories}
        selectedCategory={selectedCategory}
      />
      <Footer />
    </main>
  );
}
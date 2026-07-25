import AdminCategoryManager from "@/components/admin/AdminCategoryManager";
import Navbar from "@/components/Navbar";
import { getCategories } from "@/lib/categories";
import { getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getCategories();
  const products = await getProducts();

  return (
    <main>
      <Navbar />
      <AdminCategoryManager
        initialCategories={categories}
        initialProducts={products}
      />
    </main>
  );
}
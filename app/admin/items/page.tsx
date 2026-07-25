import AdminDashboard from "@/components/admin/AdminDashboard";
import Navbar from "@/components/Navbar";
import { getCategories } from "@/lib/categories";
import { getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function AdminItemsPage() {
  const products = await getProducts();
  const categories = await getCategories();

  return (
    <main>
      <Navbar />
      <AdminDashboard
        initialProducts={products}
        initialCategories={categories}
      />
    </main>
  );
}
import AdminOrders from "@/components/admin/AdminOrders";
import { getActiveOrders } from "@/lib/orders";

export default async function AdminOrdersPage() {
  const orders = await getActiveOrders();

  return <AdminOrders initialOrders={orders} />;
}
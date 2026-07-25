import AdminRentalOrders from "@/components/admin/AdminRentalOrders";
import Navbar from "@/components/Navbar";
import { getRentalOrders } from "@/lib/rental-orders";

export const dynamic = "force-dynamic";

export default async function AdminRentalsPage() {
  const rentalOrders = await getRentalOrders();

  return (
    <main>
      <Navbar />
      <AdminRentalOrders initialRentalOrders={rentalOrders} />
    </main>
  );
}
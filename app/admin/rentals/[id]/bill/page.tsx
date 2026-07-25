import PrintableRentalBill from "@/components/billing/PrintableRentalBill";
import { getRentalOrderById } from "@/lib/rental-orders";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface RentalBillPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RentalBillPage({
  params,
}: RentalBillPageProps) {
  const resolvedParams = await params;
  const rentalOrder = await getRentalOrderById(Number(resolvedParams.id));

  if (!rentalOrder) {
    notFound();
  }

  return <PrintableRentalBill rentalOrder={rentalOrder} />;
}
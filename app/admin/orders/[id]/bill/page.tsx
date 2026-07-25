import PrintableOrderBill from "@/components/billing/PrintableOrderBill";
import { getOrderById } from "@/lib/orders";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface OrderBillPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderBillPage({ params }: OrderBillPageProps) {
  const resolvedParams = await params;
  const order = await getOrderById(Number(resolvedParams.id));

  if (!order) {
    notFound();
  }

  return <PrintableOrderBill order={order} />;
}
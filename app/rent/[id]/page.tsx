import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import RentalForm from "@/components/rental/RentalForm";
import { getProductById } from "@/lib/products";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface RentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RentPage({ params }: RentPageProps) {
  const resolvedParams = await params;
  const product = await getProductById(Number(resolvedParams.id));

  if (!product || !product.rentalAvailable) {
    notFound();
  }

  return (
    <main>
      <Navbar />
      <RentalForm product={product} />
      <Footer />
    </main>
  );
}
import CartPageClient from "@/components/cart/CartPageClient";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function CartPage() {
  return (
    <main>
      <Navbar />
      <CartPageClient />
      <Footer />
    </main>
  );
}
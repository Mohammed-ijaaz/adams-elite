import CheckoutClient from "@/components/checkout/CheckoutClient";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function CheckoutPage() {
  return (
    <main>
      <Navbar />
      <CheckoutClient />
      <Footer />
    </main>
  );
}
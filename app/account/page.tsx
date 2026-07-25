import AccountClient from "@/components/account/AccountClient";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function AccountPage() {
  return (
    <main>
      <Navbar />
      <AccountClient />
      <Footer />
    </main>
  );
}
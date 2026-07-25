import AdminHome from "@/components/admin/AdminHome";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function AdminPage() {
  return (
    <main>
      <Navbar />
      <AdminHome />
      <Footer />
    </main>
  );
}
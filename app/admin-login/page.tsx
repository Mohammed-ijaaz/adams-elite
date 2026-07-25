import AdminLoginForm from "@/components/auth/AdminLoginForm";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function AdminLoginPage() {
  return (
    <main>
      <Navbar />
      <AdminLoginForm />
      <Footer />
    </main>
  );
}
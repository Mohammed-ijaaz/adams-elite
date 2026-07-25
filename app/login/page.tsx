import LoginForm from "@/components/auth/LoginForm";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

interface LoginPageProps {
  searchParams: Promise<{
    redirectTo?: string | string[];
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const requestedRedirect = Array.isArray(resolvedSearchParams.redirectTo)
    ? resolvedSearchParams.redirectTo[0]
    : resolvedSearchParams.redirectTo;

  const redirectTo =
    requestedRedirect?.startsWith("/") && !requestedRedirect.startsWith("//")
      ? requestedRedirect
      : "/account";

  return (
    <main>
      <Navbar />
      <LoginForm redirectTo={redirectTo} />
      <Footer />
    </main>
  );
}

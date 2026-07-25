"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface ProductPreview {
  id: number;
  name: string;
  image: string;
  category: string;
  qrCode: string;
  stockQuantity: number;
}

interface StockAdjustment {
  id: number;
  createdAt: string;
  productId: number | null;
  productName: string;
  qrCode: string;
  oldStock: number;
  quantityReduced: number;
  newStock: number;
  reason: string;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminStockScanner() {
  const router = useRouter();
  const qrInputRef = useRef<HTMLInputElement | null>(null);

  const [checking, setChecking] = useState(true);
  const [accessToken, setAccessToken] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<ProductPreview | null>(null);
  const [history, setHistory] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token || "";

      const { data } = await supabase.auth.getUser();
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

      if (!data.user?.email || data.user.email !== adminEmail || !token) {
        router.push("/admin-login");
        return;
      }

      setAccessToken(token);
      setChecking(false);

      setTimeout(() => {
        qrInputRef.current?.focus();
      }, 200);

      await loadHistory(token);
    };

    checkAdmin();
  }, [router]);

  const loadHistory = async (token: string) => {
    const response = await fetch("/api/admin/stock-scanner", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (response.ok) {
      setHistory(result.adjustments || []);
    }
  };

  const lookupProduct = async () => {
    const cleanQrCode = qrCode.trim();

    if (!cleanQrCode) {
      alert("Scan or enter QR / Item code.");
      return;
    }

    setLoading(true);
    setProduct(null);

    const response = await fetch("/api/admin/stock-scanner", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        mode: "lookup",
        qrCode: cleanQrCode,
      }),
    });

    const result = await response.json();

    setLoading(false);

    if (!response.ok) {
      alert(result.message || "Product not found.");
      qrInputRef.current?.focus();
      return;
    }

    setProduct(result.product);
    setQuantity(1);
  };

  const reduceStock = async () => {
    if (!product) {
      alert("Scan QR first.");
      return;
    }

    if (quantity <= 0) {
      alert("Quantity should be greater than 0.");
      return;
    }

    const afterStock = product.stockQuantity - quantity;

    if (afterStock < 0) {
      alert(`Only ${product.stockQuantity} stock available on website.`);
      return;
    }

    const confirmReduce = window.confirm(
      `Reduce website stock?\n\nProduct: ${product.name}\nCurrent Stock: ${product.stockQuantity}\nReduce Qty: ${quantity}\nAfter Stock: ${afterStock}`
    );

    if (!confirmReduce) {
      return;
    }

    setLoading(true);

    const response = await fetch("/api/admin/stock-scanner", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        mode: "reduce",
        qrCode: product.qrCode,
        quantity,
      }),
    });

    const result = await response.json();

    setLoading(false);

    if (!response.ok) {
      alert(result.message || "Could not reduce stock.");
      return;
    }

    alert("Website stock reduced.");

    setHistory((currentHistory) => [
      result.adjustment,
      ...currentHistory,
    ]);

    setQrCode("");
    setQuantity(1);
    setProduct(null);

    setTimeout(() => {
      qrInputRef.current?.focus();
    }, 100);
  };

  const handleQrKeyDown = async (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      await lookupProduct();
    }
  };

  if (checking) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-[#F7F1E8] px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#B87333]">
          Checking Admin Access...
        </p>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#F7F1E8] px-6 py-12 md:px-12">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin"
          className="mb-8 inline-block text-sm font-medium text-stone-600 underline"
        >
          ← Back to Admin Dashboard
        </Link>

        <p className="text-sm font-medium uppercase tracking-[0.35em] text-[#B87333]">
          Admin Stock Scanner
        </p>

        <h1 className="font-heading mt-4 text-5xl font-semibold text-stone-950">
          Reduce Website Stock
        </h1>

        <p className="mt-5 max-w-2xl text-stone-600">
          Scan the same Gofrugal QR / item code here after a shop sale. This
          will reduce the product stock on the website.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="rounded-[34px] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-stone-950">
              Scan QR / Item Code
            </h2>

            <div className="mt-6">
              <label className="text-sm font-medium text-stone-700">
                QR / Item Code
              </label>

              <input
                ref={qrInputRef}
                value={qrCode}
                onChange={(event) => setQrCode(event.target.value)}
                onKeyDown={handleQrKeyDown}
                className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-4 text-lg outline-none focus:border-[#B87333]"
                placeholder="Scan QR here and press Enter"
              />

              <p className="mt-2 text-xs text-stone-500">
                Keep cursor inside this box, scan QR, then press Enter.
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={lookupProduct}
                disabled={loading}
                className="rounded-full bg-stone-950 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#B87333] disabled:bg-stone-400"
              >
                {loading ? "Checking..." : "Find Product"}
              </button>

              <button
                onClick={() => {
                  setQrCode("");
                  setProduct(null);
                  setQuantity(1);
                  qrInputRef.current?.focus();
                }}
                className="rounded-full border border-stone-950 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-950 transition hover:bg-stone-950 hover:text-white"
              >
                Clear
              </button>
            </div>

            {product && (
              <div className="mt-8 rounded-[28px] border border-[#B87333]/15 bg-[#FFFAF3] p-5">
                <div className="flex flex-col gap-5 md:flex-row">
                  <div className="relative h-36 w-full overflow-hidden rounded-2xl bg-stone-100 md:w-36">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-stone-500">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B87333]">
                      Product Found
                    </p>

                    <h3 className="mt-2 text-2xl font-semibold text-stone-950">
                      {product.name}
                    </h3>

                    <div className="mt-3 space-y-1 text-sm text-stone-600">
                      <p>Category: {product.category || "Not provided"}</p>
                      <p className="break-all">
                        QR / Item Code:{" "}
                        <span className="font-medium text-stone-950">
                          {product.qrCode}
                        </span>
                      </p>
                      <p>
                        Current Website Stock:{" "}
                        <span className="font-semibold text-stone-950">
                          {product.stockQuantity}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-stone-700">
                      Quantity Sold in Shop
                    </label>

                    <input
                      value={quantity}
                      onChange={(event) =>
                        setQuantity(Number(event.target.value || 1))
                      }
                      type="number"
                      min={1}
                      className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
                    />
                  </div>

                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-sm text-stone-600">After Reduce</p>

                    <p className="mt-2 text-3xl font-semibold text-stone-950">
                      {Math.max(product.stockQuantity - quantity, 0)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={reduceStock}
                  disabled={loading}
                  className="mt-6 w-full rounded-full bg-[#B87333] px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-stone-950 disabled:bg-stone-400"
                >
                  {loading ? "Reducing..." : "Reduce Website Stock"}
                </button>
              </div>
            )}
          </div>

          <div className="rounded-[34px] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-stone-950">
              Recent Reductions
            </h2>

            {history.length === 0 ? (
              <div className="mt-6 rounded-2xl bg-[#F7F1E8] p-5 text-sm text-stone-600">
                No stock reductions yet.
              </div>
            ) : (
              <div className="mt-6 max-h-[650px] space-y-4 overflow-y-auto pr-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-stone-100 p-4"
                  >
                    <p className="font-semibold text-stone-950">
                      {item.productName}
                    </p>

                    <p className="mt-1 break-all text-xs text-stone-500">
                      QR: {item.qrCode}
                    </p>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-xl bg-[#F7F1E8] p-2">
                        <p className="text-stone-500">Old</p>
                        <p className="mt-1 font-semibold text-stone-950">
                          {item.oldStock}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#F7F1E8] p-2">
                        <p className="text-stone-500">Sold</p>
                        <p className="mt-1 font-semibold text-red-700">
                          -{item.quantityReduced}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#F7F1E8] p-2">
                        <p className="text-stone-500">New</p>
                        <p className="mt-1 font-semibold text-green-700">
                          {item.newStock}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-stone-500">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
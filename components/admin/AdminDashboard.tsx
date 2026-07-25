"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Product } from "@/data/products";
import { Category } from "@/data/categories";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AdminDashboardProps {
  initialProducts: Product[];
  initialCategories: Category[];
}

function isFootwearCategory(category: string) {
  const value = category.toLowerCase();
  return value.includes("footwear") || value.includes("footware");
}

export default function AdminDashboard({
  initialProducts,
  initialCategories,
}: AdminDashboardProps) {
  const router = useRouter();

  const fallbackCategory = initialCategories[0]?.name || "Fashion Jewellery";

  const [checking, setChecking] = useState(true);
  const [accessToken, setAccessToken] = useState("");
  const [products, setProducts] = useState(initialProducts);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState(fallbackCategory);
  const [price, setPrice] = useState("");
  const [barcode, setBarcode] = useState("");
  const [gstPercent, setGstPercent] = useState("3");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [description, setDescription] = useState("");
  const [featured, setFeatured] = useState(false);
  const [rentalAvailable, setRentalAvailable] = useState(false);
  const [rentalPrice, setRentalPrice] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [footwearSize, setFootwearSize] = useState("");
  const [footwearColour, setFootwearColour] = useState("");

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const stockQuantityInputRef = useRef<HTMLInputElement>(null);

  const categoryOptions = useMemo(() => {
    if (initialCategories.length > 0) {
      return initialCategories.map((item) => item.name);
    }

    return [
      "Fashion Jewellery",
      "Bridal Collection",
      "Rental Jewellery",
      "Perfumes",
      "Handbags",
      "Footwear",
    ];
  }, [initialCategories]);

  const showFootwearFields = isFootwearCategory(category);

  const handleBarcodeKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    window.requestAnimationFrame(() => {
      stockQuantityInputRef.current?.focus();
      stockQuantityInputRef.current?.select();
    });
  };

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
    };

    checkAdmin();
  }, [router]);

  const resetForm = () => {
    setEditingProduct(null);
    setName("");
    setCategory(categoryOptions[0] || "Fashion Jewellery");
    setPrice("");
    setBarcode("");
    setGstPercent("3");
    setStockQuantity("0");
    setDescription("");
    setFeatured(false);
    setRentalAvailable(false);
    setRentalPrice("");
    setAdvanceAmount("");
    setFootwearSize("");
    setFootwearColour("");
    setExistingImages([]);
    setImageFiles([]);
    setImagePreviews([]);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    setImageFiles(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const removeExistingImage = (image: string) => {
    setExistingImages(existingImages.filter((item) => item !== image));
  };

  const removeNewImage = (index: number) => {
    setImageFiles(imageFiles.filter((_, itemIndex) => itemIndex !== index));
    setImagePreviews(
      imagePreviews.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setCategory(product.category);
    setPrice(String(product.price));
    setBarcode(product.barcode || "");
    setGstPercent(String(product.gstPercent ?? 3));
    setStockQuantity(String(product.stockQuantity ?? 0));
    setDescription(product.description || "");
    setFeatured(product.featured);
    setRentalAvailable(product.rentalAvailable);
    setRentalPrice(product.rentalPrice ? String(product.rentalPrice) : "");
    setAdvanceAmount(product.advanceAmount ? String(product.advanceAmount) : "");
    setFootwearSize(product.footwearSize || "");
    setFootwearColour(product.footwearColour || "");

    const productImages =
      product.images && product.images.length > 0
        ? product.images
        : [product.image];

    setExistingImages(productImages);
    setImageFiles([]);
    setImagePreviews([]);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name || !price) {
      alert("Please enter product name and price.");
      return;
    }

    if (!category) {
      alert("Please choose category.");
      return;
    }

    if (!gstPercent) {
      alert("Please enter GST percent.");
      return;
    }

    if (stockQuantity === "") {
      alert("Please enter stock quantity.");
      return;
    }

    if (!editingProduct && imageFiles.length === 0) {
      alert("Please upload at least one product image.");
      return;
    }

    if (
      editingProduct &&
      existingImages.length === 0 &&
      imageFiles.length === 0
    ) {
      alert("Please keep or upload at least one image.");
      return;
    }

    if (rentalAvailable && !rentalPrice) {
      alert("Please enter rental price.");
      return;
    }

    if (rentalAvailable && !advanceAmount) {
      alert("Please enter advance amount.");
      return;
    }

    setIsSaving(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("category", category);
    formData.append("price", price);
    formData.append("barcode", barcode);
    formData.append("gstPercent", gstPercent);
    formData.append("stockQuantity", stockQuantity);
    formData.append("description", description);
    formData.append("featured", String(featured));
    formData.append("rentalAvailable", String(rentalAvailable));
    formData.append("rentalPrice", rentalPrice);
    formData.append("advanceAmount", advanceAmount);
    formData.append("footwearSize", footwearSize);
    formData.append("footwearColour", footwearColour);

    imageFiles.forEach((file) => {
      formData.append("images", file);
    });

    if (editingProduct) {
      formData.append("id", String(editingProduct.id));
      formData.append("existingImages", JSON.stringify(existingImages));
    }

    const response = await fetch("/api/admin/products", {
      method: editingProduct ? "PUT" : "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    const result = await response.json();

    setIsSaving(false);

    if (!response.ok) {
      alert(result.message || "Something went wrong.");
      return;
    }

    if (editingProduct) {
      setProducts(
        products.map((product) =>
          product.id === editingProduct.id ? result.product : product
        )
      );
    } else {
      setProducts([result.product, ...products]);
    }

    resetForm();
  };

  const handleDeleteProduct = async (product: Product) => {
    const confirmDelete = confirm(`Delete "${product.name}"?`);

    if (!confirmDelete) return;

    setDeletingId(product.id);

    const response = await fetch("/api/admin/products", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        id: product.id,
        image: product.image,
        images: product.images,
      }),
    });

    const result = await response.json();

    setDeletingId(null);

    if (!response.ok) {
      alert(result.message || "Could not delete product.");
      return;
    }

    setProducts(products.filter((item) => item.id !== product.id));
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

        <div>
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-[#B87333]">
            Update Items
          </p>

          <h1 className="font-heading mt-4 text-5xl font-semibold text-stone-950">
            Manage Products
          </h1>

          <p className="mt-5 max-w-2xl text-stone-600">
            Add products using live categories. Footwear products can include
            size and colour.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-stone-500">Products</p>
            <h2 className="mt-2 text-3xl font-semibold">{products.length}</h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-stone-500">Total Stock</p>
            <h2 className="mt-2 text-3xl font-semibold">
              {products.reduce(
                (total, product) => total + (product.stockQuantity || 0),
                0
              )}
            </h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-stone-500">Rental Enabled</p>
            <h2 className="mt-2 text-3xl font-semibold">
              {products.filter((product) => product.rentalAvailable).length}
            </h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-stone-500">Featured</p>
            <h2 className="mt-2 text-3xl font-semibold">
              {products.filter((product) => product.featured).length}
            </h2>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[420px_1fr]">
          <form
            onSubmit={handleSaveProduct}
            className="rounded-[34px] bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold text-stone-950">
                {editingProduct ? "Edit Product" : "Add Product"}
              </h2>

              {editingProduct && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-sm font-medium text-stone-500 underline"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-stone-700">
                  Product Name
                </label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
                  placeholder="Eg: Bridal Necklace Set"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(event) => {
                    const selectedCategory = event.target.value;
                    setCategory(selectedCategory);

                    if (!isFootwearCategory(selectedCategory)) {
                      setFootwearSize("");
                      setFootwearColour("");
                    }
                  }}
                  className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
                >
                  {categoryOptions.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>

                <Link
                  href="/admin/categories"
                  className="mt-2 inline-block text-xs font-medium text-[#B87333] underline"
                >
                  Manage categories
                </Link>
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700">
                  Selling Price
                </label>
                <input
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  type="number"
                  className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
                  placeholder="Eg: 2999"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700">
                  Barcode Number
                </label>
                <input
                  value={barcode}
                  onChange={(event) => setBarcode(event.target.value)}
                  onKeyDown={handleBarcodeKeyDown}
                  autoComplete="off"
                  enterKeyHint="next"
                  className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
                  placeholder="Scan or enter barcode number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-stone-700">
                    GST %
                  </label>
                  <input
                    value={gstPercent}
                    onChange={(event) => setGstPercent(event.target.value)}
                    type="number"
                    className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
                    placeholder="Eg: 3"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-stone-700">
                    Stock Qty
                  </label>
                  <input
                    ref={stockQuantityInputRef}
                    value={stockQuantity}
                    onChange={(event) => setStockQuantity(event.target.value)}
                    type="number"
                    className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
                    placeholder="Eg: 10"
                  />
                </div>
              </div>

              {showFootwearFields && (
                <div className="rounded-2xl bg-[#F7F1E8] p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#B87333]">
                    Footwear Details
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-stone-700">
                        Size
                      </label>
                      <input
                        value={footwearSize}
                        onChange={(event) =>
                          setFootwearSize(event.target.value)
                        }
                        className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
                        placeholder="Eg: 6, 7, 8"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-stone-700">
                        Colour
                      </label>
                      <input
                        value={footwearColour}
                        onChange={(event) =>
                          setFootwearColour(event.target.value)
                        }
                        className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
                        placeholder="Eg: Gold, Silver"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-stone-700">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="mt-2 min-h-28 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
                  placeholder="Write product details..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700">
                  Product Images
                </label>

                <input
                  onChange={handleImageChange}
                  type="file"
                  accept="image/*"
                  multiple
                  className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3"
                />

                {existingImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                      Existing Images
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {existingImages.map((image) => (
                        <div
                          key={image}
                          className="relative h-32 overflow-hidden rounded-2xl bg-stone-100"
                        >
                          <Image
                            src={image}
                            alt="Existing product image"
                            fill
                            unoptimized
                            className="object-cover"
                          />

                          <button
                            type="button"
                            onClick={() => removeExistingImage(image)}
                            className="absolute right-2 top-2 rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {imagePreviews.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                      New Images
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {imagePreviews.map((image, index) => (
                        <div
                          key={image}
                          className="relative h-32 overflow-hidden rounded-2xl bg-stone-100"
                        >
                          <Image
                            src={image}
                            alt="New product preview"
                            fill
                            unoptimized
                            className="object-cover"
                          />

                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="absolute right-2 top-2 rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <label className="flex items-center gap-3 text-sm text-stone-700">
                <input
                  checked={featured}
                  onChange={(event) => setFeatured(event.target.checked)}
                  type="checkbox"
                />
                Show in Featured Products
              </label>

              <label className="flex items-center gap-3 text-sm text-stone-700">
                <input
                  checked={rentalAvailable}
                  onChange={(event) => setRentalAvailable(event.target.checked)}
                  type="checkbox"
                />
                Rental Available
              </label>

              {rentalAvailable && (
                <div className="rounded-2xl bg-[#F7F1E8] p-4">
                  <div>
                    <label className="text-sm font-medium text-stone-700">
                      Rental Price
                    </label>
                    <input
                      value={rentalPrice}
                      onChange={(event) => setRentalPrice(event.target.value)}
                      type="number"
                      className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
                      placeholder="Eg: 1499"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="text-sm font-medium text-stone-700">
                      Advance Amount
                    </label>
                    <input
                      value={advanceAmount}
                      onChange={(event) => setAdvanceAmount(event.target.value)}
                      type="number"
                      className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
                      placeholder="Eg: 1000"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full rounded-full bg-stone-950 px-6 py-4 text-sm font-medium uppercase tracking-widest text-white transition hover:bg-[#B87333] disabled:cursor-not-allowed disabled:bg-stone-400"
              >
                {isSaving
                  ? "Saving..."
                  : editingProduct
                  ? "Update Product"
                  : "Add Product"}
              </button>
            </div>
          </form>

          <div className="rounded-[34px] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-stone-950">
              Product List
            </h2>

            <div className="mt-6 space-y-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 rounded-2xl border border-stone-100 p-4"
                >
                  <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-stone-100">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-stone-950">
                      {product.name}
                    </h3>

                    <p className="mt-1 text-sm text-stone-500">
                      {product.category}
                    </p>

                    {product.barcode && (
                      <p className="mt-1 text-xs text-stone-500">
                        Barcode: {product.barcode}
                      </p>
                    )}

                    {(product.footwearSize || product.footwearColour) && (
                      <p className="mt-1 text-xs text-stone-500">
                        Size: {product.footwearSize || "-"} | Colour:{" "}
                        {product.footwearColour || "-"}
                      </p>
                    )}

                    <p className="mt-1 text-xs text-stone-400">
                      {product.images?.length || 1} image
                      {(product.images?.length || 1) === 1 ? "" : "s"}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                        GST {product.gstPercent || 0}%
                      </span>

                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                        Stock {product.stockQuantity || 0}
                      </span>

                      {product.featured && (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                          Featured
                        </span>
                      )}

                      {product.rentalAvailable && (
                        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                          Rental ₹{product.rentalPrice}
                        </span>
                      )}

                      {product.rentalAvailable && product.advanceAmount && (
                        <span className="rounded-full bg-[#B87333]/10 px-3 py-1 text-xs font-medium text-[#7A3E1D]">
                          Advance ₹{product.advanceAmount}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="font-medium text-stone-950">
                    ₹{product.price}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(product)}
                      className="rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-950 hover:text-white"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDeleteProduct(product)}
                      disabled={deletingId === product.id}
                      className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
                    >
                      {deletingId === product.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
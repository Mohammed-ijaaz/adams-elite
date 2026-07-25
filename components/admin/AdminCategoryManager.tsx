"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Category } from "@/data/categories";
import { Product } from "@/data/products";

interface AdminCategoryManagerProps {
  initialCategories: Category[];
  initialProducts: Product[];
}

interface ProductMove {
  productId: number;
  newCategory: string;
}

export default function AdminCategoryManager({
  initialCategories,
  initialProducts,
}: AdminCategoryManagerProps) {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [accessToken, setAccessToken] = useState("");

  const [categories, setCategories] = useState(initialCategories);
  const [products, setProducts] = useState(initialProducts);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState("");
  const [imageInputKey, setImageInputKey] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryImageFile, setEditCategoryImageFile] =
    useState<File | null>(null);
  const [editCategoryImagePreview, setEditCategoryImagePreview] = useState("");
  const [editImageInputKey, setEditImageInputKey] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  );
  const [productMoves, setProductMoves] = useState<ProductMove[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const productsInDeletingCategory = useMemo(() => {
    if (!deletingCategory) return [];

    return products.filter(
      (product) => product.category === deletingCategory.name
    );
  }, [deletingCategory, products]);

  const availableMoveCategories = useMemo(() => {
    if (!deletingCategory) return categories;

    return categories.filter(
      (category) => category.name !== deletingCategory.name
    );
  }, [categories, deletingCategory]);

  const handleCategoryImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setCategoryImageFile(file);
    setCategoryImagePreview(URL.createObjectURL(file));
  };

  const clearCategoryImage = () => {
    setCategoryImageFile(null);
    setCategoryImagePreview("");
    setImageInputKey((current) => current + 1);
  };

  const handleEditCategoryImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setEditCategoryImageFile(file);
    setEditCategoryImagePreview(URL.createObjectURL(file));
  };

  const clearEditCategoryImage = () => {
    setEditCategoryImageFile(null);
    setEditCategoryImagePreview("");
    setEditImageInputKey((current) => current + 1);
  };

  const cancelEditCategory = () => {
    setEditingCategory(null);
    setEditCategoryName("");
    setEditCategoryImageFile(null);
    setEditCategoryImagePreview("");
    setEditImageInputKey((current) => current + 1);
  };

  const startEditCategory = (category: Category) => {
    setEditingCategory(category);
    setEditCategoryName(category.name);
    setEditCategoryImageFile(null);
    setEditCategoryImagePreview("");
    setEditImageInputKey((current) => current + 1);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newCategoryName.trim()) {
      alert("Enter category name.");
      return;
    }

    setIsAdding(true);

    const formData = new FormData();
    formData.append("name", newCategoryName.trim());

    if (categoryImageFile) {
      formData.append("image", categoryImageFile);
    }

    const response = await fetch("/api/admin/categories", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    const result = await response.json();

    setIsAdding(false);

    if (!response.ok) {
      alert(result.message || "Could not add category.");
      return;
    }

    setCategories(
      [...categories, result.category].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );

    setNewCategoryName("");
    clearCategoryImage();
  };

  const handleUpdateCategory = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!editingCategory) return;

    if (!editCategoryName.trim()) {
      alert("Enter category name.");
      return;
    }

    setIsEditing(true);

    const formData = new FormData();
    formData.append("id", String(editingCategory.id));
    formData.append("oldName", editingCategory.name);
    formData.append("name", editCategoryName.trim());
    formData.append("oldImage", editingCategory.image || "");

    if (editCategoryImageFile) {
      formData.append("image", editCategoryImageFile);
    }

    const response = await fetch("/api/admin/categories", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    const result = await response.json();

    setIsEditing(false);

    if (!response.ok) {
      alert(result.message || "Could not update category.");
      return;
    }

    const updatedCategory: Category = result.category;

    setCategories(
      categories
        .map((category) =>
          category.id === updatedCategory.id ? updatedCategory : category
        )
        .sort((a, b) => a.name.localeCompare(b.name))
    );

    setProducts(
      products.map((product) =>
        product.category === editingCategory.name
          ? { ...product, category: updatedCategory.name }
          : product
      )
    );

    cancelEditCategory();
  };

  const startDeleteCategory = (category: Category) => {
    const productsInside = products.filter(
      (product) => product.category === category.name
    );

    if (productsInside.length === 0) {
      const confirmDelete = confirm(`Delete category "${category.name}"?`);

      if (!confirmDelete) return;

      deleteCategory(category, []);
      return;
    }

    const firstMoveCategory = categories.find(
      (item) => item.name !== category.name
    );

    if (!firstMoveCategory) {
      alert("Create another category first before deleting this category.");
      return;
    }

    setDeletingCategory(category);
    setProductMoves(
      productsInside.map((product) => ({
        productId: product.id,
        newCategory: firstMoveCategory.name,
      }))
    );
  };

  const updateProductMove = (productId: number, newCategory: string) => {
    setProductMoves(
      productMoves.map((move) =>
        move.productId === productId ? { ...move, newCategory } : move
      )
    );
  };

  const deleteCategory = async (
    category: Category,
    movesToUse: ProductMove[]
  ) => {
    setIsDeleting(true);

    const response = await fetch("/api/admin/categories", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        categoryName: category.name,
        productMoves: movesToUse,
      }),
    });

    const result = await response.json();

    setIsDeleting(false);

    if (!response.ok) {
      alert(result.message || "Could not delete category.");
      return;
    }

    setCategories(categories.filter((item) => item.id !== category.id));

    setProducts(
      products.map((product) => {
        const move = movesToUse.find((item) => item.productId === product.id);

        if (!move) return product;

        return {
          ...product,
          category: move.newCategory,
        };
      })
    );

    setDeletingCategory(null);
    setProductMoves([]);
  };

  const confirmMoveAndDelete = () => {
    if (!deletingCategory) return;

    const allSelected = productMoves.every(
      (move) => move.newCategory && move.newCategory !== deletingCategory.name
    );

    if (!allSelected) {
      alert("Choose a new category for every product.");
      return;
    }

    const confirmDelete = confirm(
      `Move these products and delete "${deletingCategory.name}"?`
    );

    if (!confirmDelete) return;

    deleteCategory(deletingCategory, productMoves);
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
          Admin Categories
        </p>

        <h1 className="font-heading mt-4 text-5xl font-semibold text-stone-950">
          Manage Categories
        </h1>

        <p className="mt-5 max-w-2xl text-stone-600">
          Add, edit and delete category names and images.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[420px_1fr]">
          <div className="space-y-8">
            <form
              onSubmit={handleAddCategory}
              className="h-fit rounded-[34px] bg-white p-6 shadow-sm"
            >
              <h2 className="text-2xl font-semibold text-stone-950">
                Add Category
              </h2>

              <div className="mt-6">
                <label className="text-sm font-medium text-stone-700">
                  Category Name
                </label>

                <input
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
                  placeholder="Eg: Kids Jewellery"
                />
              </div>

              <div className="mt-5">
                <label className="text-sm font-medium text-stone-700">
                  Category Image
                </label>

                <input
                  key={imageInputKey}
                  onChange={handleCategoryImageChange}
                  type="file"
                  accept="image/*"
                  className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3"
                />

                {categoryImagePreview && (
                  <div className="relative mt-4 h-48 overflow-hidden rounded-2xl bg-stone-100">
                    <Image
                      src={categoryImagePreview}
                      alt="Category preview"
                      fill
                      unoptimized
                      className="object-cover"
                    />

                    <button
                      type="button"
                      onClick={clearCategoryImage}
                      className="absolute right-3 top-3 rounded-full bg-red-600 px-4 py-2 text-xs font-medium text-white"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <button
                disabled={isAdding}
                className="mt-6 w-full rounded-full bg-stone-950 px-6 py-4 text-sm font-medium uppercase tracking-widest text-white transition hover:bg-[#B87333] disabled:bg-stone-400"
              >
                {isAdding ? "Adding..." : "Add Category"}
              </button>
            </form>

            {editingCategory && (
              <form
                onSubmit={handleUpdateCategory}
                className="h-fit rounded-[34px] border border-[#B87333]/20 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-semibold text-stone-950">
                    Edit Category
                  </h2>

                  <button
                    type="button"
                    onClick={cancelEditCategory}
                    className="text-sm font-medium text-stone-500 underline"
                  >
                    Cancel
                  </button>
                </div>

                <div className="mt-6">
                  <label className="text-sm font-medium text-stone-700">
                    Category Name
                  </label>

                  <input
                    value={editCategoryName}
                    onChange={(event) =>
                      setEditCategoryName(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
                    placeholder="Eg: Footwear"
                  />
                </div>

                <div className="mt-5">
                  <label className="text-sm font-medium text-stone-700">
                    Change Category Image
                  </label>

                  <input
                    key={editImageInputKey}
                    onChange={handleEditCategoryImageChange}
                    type="file"
                    accept="image/*"
                    className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3"
                  />

                  <div className="relative mt-4 h-48 overflow-hidden rounded-2xl bg-stone-100">
                    {editCategoryImagePreview ? (
                      <Image
                        src={editCategoryImagePreview}
                        alt="New category preview"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : editingCategory.image ? (
                      <Image
                        src={editingCategory.image}
                        alt={editingCategory.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-stone-400">
                        No Image
                      </div>
                    )}

                    {editCategoryImagePreview && (
                      <button
                        type="button"
                        onClick={clearEditCategoryImage}
                        className="absolute right-3 top-3 rounded-full bg-red-600 px-4 py-2 text-xs font-medium text-white"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <button
                  disabled={isEditing}
                  className="mt-6 w-full rounded-full bg-[#B87333] px-6 py-4 text-sm font-medium uppercase tracking-widest text-white transition hover:bg-stone-950 disabled:bg-stone-400"
                >
                  {isEditing ? "Updating..." : "Update Category"}
                </button>
              </form>
            )}
          </div>

          <div className="rounded-[34px] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-stone-950">
              Category List
            </h2>

            <div className="mt-6 space-y-4">
              {categories.map((category) => {
                const productCount = products.filter(
                  (product) => product.category === category.name
                ).length;

                return (
                  <div
                    key={category.id}
                    className="flex flex-col gap-4 rounded-2xl border border-stone-100 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-stone-100">
                        {category.image ? (
                          <Image
                            src={category.image}
                            alt={category.name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-stone-400">
                            No Image
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-stone-950">
                          {category.name}
                        </h3>

                        <p className="mt-1 text-sm text-stone-500">
                          {productCount} product
                          {productCount === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => startEditCategory(category)}
                        className="rounded-full border border-[#B87333]/30 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#B87333] transition hover:bg-[#B87333] hover:text-white"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => startDeleteCategory(category)}
                        className="rounded-full border border-red-200 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-red-600 transition hover:bg-red-600 hover:text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {deletingCategory && (
          <div className="mt-10 rounded-[34px] border border-red-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-600">
                  Move Products Before Delete
                </p>

                <h2 className="mt-3 text-3xl font-semibold text-stone-950">
                  Delete "{deletingCategory.name}"
                </h2>

                <p className="mt-3 text-sm leading-6 text-stone-600">
                  This category has products. Choose where each product should
                  move before deleting.
                </p>
              </div>

              <button
                onClick={() => {
                  setDeletingCategory(null);
                  setProductMoves([]);
                }}
                className="text-sm font-medium text-stone-500 underline"
              >
                Cancel
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {productsInDeletingCategory.map((product) => {
                const selectedMove = productMoves.find(
                  (move) => move.productId === product.id
                );

                return (
                  <div
                    key={product.id}
                    className="grid gap-4 rounded-2xl bg-[#F7F1E8] p-4 md:grid-cols-[1fr_300px]"
                  >
                    <div>
                      <h3 className="font-semibold text-stone-950">
                        {product.name}
                      </h3>

                      <p className="mt-1 text-sm text-stone-500">
                        Current category: {product.category}
                      </p>
                    </div>

                    <select
                      value={selectedMove?.newCategory || ""}
                      onChange={(event) =>
                        updateProductMove(product.id, event.target.value)
                      }
                      className="rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
                    >
                      {availableMoveCategories.map((category) => (
                        <option key={category.id} value={category.name}>
                          Move to {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            <button
              onClick={confirmMoveAndDelete}
              disabled={isDeleting}
              className="mt-6 rounded-full bg-red-600 px-7 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-red-700 disabled:bg-red-300"
            >
              {isDeleting ? "Deleting..." : "Move Products & Delete Category"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
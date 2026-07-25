import { Category } from "@/data/categories";
import { supabaseAdmin } from "./supabase-admin";

function mapCategory(category: any): Category {
  return {
    id: category.id,
    createdAt: category.created_at,
    name: category.name,
    image: category.image || "",
  };
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("id, created_at, name, image")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error.message);
    return [];
  }

  return data.map(mapCategory);
}
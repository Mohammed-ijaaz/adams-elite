import { Product, fallbackProducts } from "@/data/products";
import { supabase } from "./supabase";

function mapProduct(product: any): Product {
  const images =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.image];

  return {
    id: product.id,
    name: product.name,
    category: product.category,
    price: Number(product.price),
    barcode: product.barcode || "",
    image: images[0],
    images,
    featured: product.featured,
    description: product.description || "",
    rentalAvailable: product.rental_available || false,
    rentalPrice:
      product.rental_price === null || product.rental_price === undefined
        ? null
        : Number(product.rental_price),
    advanceAmount:
      product.advance_amount === null || product.advance_amount === undefined
        ? null
        : Number(product.advance_amount),
    gstPercent:
      product.gst_percent === null || product.gst_percent === undefined
        ? 3
        : Number(product.gst_percent),
    stockQuantity:
      product.stock_quantity === null || product.stock_quantity === undefined
        ? 0
        : Number(product.stock_quantity),
    footwearSize: product.footwear_size || "",
    footwearColour: product.footwear_colour || "",
  };
}

const productSelect =
  "id, name, category, price, barcode, image, images, featured, description, rental_available, rental_price, advance_amount, gst_percent, stock_quantity, footwear_size, footwear_colour";

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error.message);
    return fallbackProducts;
  }

  if (!data || data.length === 0) {
    return fallbackProducts;
  }

  return data.map(mapProduct);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await getProducts();
  return products.filter((product) => product.featured);
}

export async function getProductById(id: number): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("id", id)
    .single();

  if (error) {
    const fallbackProduct = fallbackProducts.find(
      (product) => product.id === id
    );

    return fallbackProduct || null;
  }

  return mapProduct(data);
}
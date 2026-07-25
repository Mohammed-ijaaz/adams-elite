import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdminRequest } from "@/lib/verify-admin";

const productSelect =
  "id, name, category, price, barcode, image, images, featured, description, rental_available, rental_price, advance_amount, gst_percent, stock_quantity, footwear_size, footwear_colour";

function isFootwearCategory(category: string) {
  const value = category.toLowerCase();
  return value.includes("footwear") || value.includes("footware");
}

async function uploadProductImage(imageFile: File) {
  const fileExtension = imageFile.name.split(".").pop();
  const fileName = `${Date.now()}-${randomUUID()}.${fileExtension}`;
  const filePath = `products/${fileName}`;

  const arrayBuffer = await imageFile.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabaseAdmin.storage
    .from("product-images")
    .upload(filePath, fileBuffer, {
      contentType: imageFile.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from("product-images")
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

async function uploadProductImages(imageFiles: File[]) {
  const uploadedImages: string[] = [];

  for (const file of imageFiles) {
    const imageUrl = await uploadProductImage(file);
    uploadedImages.push(imageUrl);
  }

  return uploadedImages;
}

async function deleteProductImage(image: string) {
  if (typeof image === "string" && image.includes("/product-images/")) {
    const imagePath = image.split("/product-images/")[1];

    if (imagePath) {
      await supabaseAdmin.storage
        .from("product-images")
        .remove([decodeURIComponent(imagePath)]);
    }
  }
}

async function deleteProductImages(images: string[]) {
  for (const image of images) {
    await deleteProductImage(image);
  }
}

function mapProduct(product: any) {
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

export async function POST(request: Request) {
  const { errorResponse } = await verifyAdminRequest(request);

  if (errorResponse) {
    return errorResponse;
  }

  const formData = await request.formData();

  const name = String(formData.get("name") || "");
  const category = String(formData.get("category") || "");
  const price = Number(formData.get("price") || 0);
  const barcode = String(formData.get("barcode") || "");
  const featured = String(formData.get("featured")) === "true";
  const description = String(formData.get("description") || "");
  const rentalAvailable = String(formData.get("rentalAvailable")) === "true";
  const rentalPriceValue = String(formData.get("rentalPrice") || "");
  const advanceAmountValue = String(formData.get("advanceAmount") || "");
  const gstPercentValue = String(formData.get("gstPercent") || "3");
  const stockQuantityValue = String(formData.get("stockQuantity") || "0");
  const footwearSizeValue = String(formData.get("footwearSize") || "");
  const footwearColourValue = String(formData.get("footwearColour") || "");

  const rentalPrice = rentalPriceValue ? Number(rentalPriceValue) : null;
  const advanceAmount = advanceAmountValue ? Number(advanceAmountValue) : null;
  const gstPercent = gstPercentValue ? Number(gstPercentValue) : 3;
  const stockQuantity = stockQuantityValue ? Number(stockQuantityValue) : 0;

  const footwearSize = isFootwearCategory(category) ? footwearSizeValue : "";
  const footwearColour = isFootwearCategory(category) ? footwearColourValue : "";

  const imageFiles = formData
    .getAll("images")
    .filter((file): file is File => file instanceof File && file.size > 0);

  if (!name || !category || !price || imageFiles.length === 0) {
    return NextResponse.json(
      { message: "Name, category, price and at least one image are required." },
      { status: 400 }
    );
  }

  try {
    const uploadedImages = await uploadProductImages(imageFiles);

    const { data: product, error: insertError } = await supabaseAdmin
      .from("products")
      .insert({
        name,
        category,
        price,
        barcode,
        image: uploadedImages[0],
        images: uploadedImages,
        featured,
        description,
        rental_available: rentalAvailable,
        rental_price: rentalAvailable ? rentalPrice : null,
        advance_amount: rentalAvailable ? advanceAmount : null,
        gst_percent: gstPercent,
        stock_quantity: stockQuantity,
        footwear_size: footwearSize,
        footwear_colour: footwearColour,
      })
      .select(productSelect)
      .single();

    if (insertError) {
      return NextResponse.json(
        { message: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ product: mapProduct(product) });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Upload failed." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const { errorResponse } = await verifyAdminRequest(request);

  if (errorResponse) {
    return errorResponse;
  }

  const formData = await request.formData();

  const id = Number(formData.get("id") || 0);
  const name = String(formData.get("name") || "");
  const category = String(formData.get("category") || "");
  const price = Number(formData.get("price") || 0);
  const barcode = String(formData.get("barcode") || "");
  const featured = String(formData.get("featured")) === "true";
  const description = String(formData.get("description") || "");
  const rentalAvailable = String(formData.get("rentalAvailable")) === "true";
  const rentalPriceValue = String(formData.get("rentalPrice") || "");
  const advanceAmountValue = String(formData.get("advanceAmount") || "");
  const gstPercentValue = String(formData.get("gstPercent") || "3");
  const stockQuantityValue = String(formData.get("stockQuantity") || "0");
  const footwearSizeValue = String(formData.get("footwearSize") || "");
  const footwearColourValue = String(formData.get("footwearColour") || "");
  const existingImagesValue = String(formData.get("existingImages") || "[]");

  const rentalPrice = rentalPriceValue ? Number(rentalPriceValue) : null;
  const advanceAmount = advanceAmountValue ? Number(advanceAmountValue) : null;
  const gstPercent = gstPercentValue ? Number(gstPercentValue) : 3;
  const stockQuantity = stockQuantityValue ? Number(stockQuantityValue) : 0;

  const footwearSize = isFootwearCategory(category) ? footwearSizeValue : "";
  const footwearColour = isFootwearCategory(category) ? footwearColourValue : "";

  const imageFiles = formData
    .getAll("images")
    .filter((file): file is File => file instanceof File && file.size > 0);

  let existingImages: string[] = [];

  try {
    existingImages = JSON.parse(existingImagesValue);
  } catch {
    existingImages = [];
  }

  if (!id || !name || !category || !price) {
    return NextResponse.json(
      { message: "ID, name, category and price are required." },
      { status: 400 }
    );
  }

  if (existingImages.length === 0 && imageFiles.length === 0) {
    return NextResponse.json(
      { message: "Please keep or upload at least one image." },
      { status: 400 }
    );
  }

  try {
    const uploadedImages = await uploadProductImages(imageFiles);
    const finalImages = [...existingImages, ...uploadedImages];

    const { data: oldProduct } = await supabaseAdmin
      .from("products")
      .select("images, image")
      .eq("id", id)
      .single();

    const oldImages =
      oldProduct &&
      Array.isArray(oldProduct.images) &&
      oldProduct.images.length > 0
        ? oldProduct.images
        : oldProduct?.image
        ? [oldProduct.image]
        : [];

    const removedImages = oldImages.filter(
      (oldImage: string) => !finalImages.includes(oldImage)
    );

    await deleteProductImages(removedImages);

    const { data: product, error: updateError } = await supabaseAdmin
      .from("products")
      .update({
        name,
        category,
        price,
        barcode,
        image: finalImages[0],
        images: finalImages,
        featured,
        description,
        rental_available: rentalAvailable,
        rental_price: rentalAvailable ? rentalPrice : null,
        advance_amount: rentalAvailable ? advanceAmount : null,
        gst_percent: gstPercent,
        stock_quantity: stockQuantity,
        footwear_size: footwearSize,
        footwear_colour: footwearColour,
      })
      .eq("id", id)
      .select(productSelect)
      .single();

    if (updateError) {
      return NextResponse.json(
        { message: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ product: mapProduct(product) });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Update failed." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { errorResponse } = await verifyAdminRequest(request);

  if (errorResponse) {
    return errorResponse;
  }

  const body = await request.json();
  const id = body.id;
  const images = Array.isArray(body.images) ? body.images : [];
  const image = body.image;

  if (!id) {
    return NextResponse.json(
      { message: "Product ID is required." },
      { status: 400 }
    );
  }

  const { error: deleteError } = await supabaseAdmin
    .from("products")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ message: deleteError.message }, { status: 500 });
  }

  if (images.length > 0) {
    await deleteProductImages(images);
  } else if (image) {
    await deleteProductImage(image);
  }

  return NextResponse.json({ success: true });
}
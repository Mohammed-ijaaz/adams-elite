import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdminRequest } from "@/lib/verify-admin";

async function uploadCategoryImage(imageFile: File) {
  const fileExtension = imageFile.name.split(".").pop();
  const fileName = `${Date.now()}-${randomUUID()}.${fileExtension}`;
  const filePath = `categories/${fileName}`;

  const arrayBuffer = await imageFile.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabaseAdmin.storage
    .from("category-images")
    .upload(filePath, fileBuffer, {
      contentType: imageFile.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from("category-images")
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

async function deleteCategoryImage(image: string) {
  if (typeof image === "string" && image.includes("/category-images/")) {
    const imagePath = image.split("/category-images/")[1];

    if (imagePath) {
      await supabaseAdmin.storage
        .from("category-images")
        .remove([decodeURIComponent(imagePath)]);
    }
  }
}

function mapCategory(category: any) {
  return {
    id: category.id,
    createdAt: category.created_at,
    name: category.name,
    image: category.image || "",
  };
}

export async function POST(request: Request) {
  const { errorResponse } = await verifyAdminRequest(request);

  if (errorResponse) {
    return errorResponse;
  }

  const formData = await request.formData();

  const name = String(formData.get("name") || "").trim();
  const imageFile = formData.get("image") as File | null;

  if (!name) {
    return NextResponse.json(
      { message: "Category name is required." },
      { status: 400 }
    );
  }

  try {
    let image = "";

    if (imageFile && imageFile.size > 0) {
      image = await uploadCategoryImage(imageFile);
    }

    const { data: category, error } = await supabaseAdmin
      .from("categories")
      .insert({ name, image })
      .select("id, created_at, name, image")
      .single();

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: error.code === "23505" ? 409 : 500 }
      );
    }

    return NextResponse.json({ category: mapCategory(category) });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Could not add category.",
      },
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
  const oldName = String(formData.get("oldName") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const oldImage = String(formData.get("oldImage") || "");
  const imageFile = formData.get("image") as File | null;

  if (!id || !oldName || !name) {
    return NextResponse.json(
      { message: "Category ID, old name and new name are required." },
      { status: 400 }
    );
  }

  try {
    let image = oldImage;

    if (imageFile && imageFile.size > 0) {
      image = await uploadCategoryImage(imageFile);
    }

    const { data: category, error: updateError } = await supabaseAdmin
      .from("categories")
      .update({ name, image })
      .eq("id", id)
      .select("id, created_at, name, image")
      .single();

    if (updateError) {
      return NextResponse.json(
        { message: updateError.message },
        { status: updateError.code === "23505" ? 409 : 500 }
      );
    }

    if (oldName !== name) {
      const { error: productsUpdateError } = await supabaseAdmin
        .from("products")
        .update({ category: name })
        .eq("category", oldName);

      if (productsUpdateError) {
        return NextResponse.json(
          { message: productsUpdateError.message },
          { status: 500 }
        );
      }
    }

    if (imageFile && imageFile.size > 0 && oldImage) {
      await deleteCategoryImage(oldImage);
    }

    return NextResponse.json({ category: mapCategory(category) });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Could not update category.",
      },
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

  const categoryName = String(body.categoryName || "").trim();
  const productMoves = Array.isArray(body.productMoves)
    ? body.productMoves
    : [];

  if (!categoryName) {
    return NextResponse.json(
      { message: "Category name is required." },
      { status: 400 }
    );
  }

  const { data: categoryToDelete } = await supabaseAdmin
    .from("categories")
    .select("id, name, image")
    .eq("name", categoryName)
    .single();

  const { data: productsInCategory, error: productsError } =
    await supabaseAdmin
      .from("products")
      .select("id, name")
      .eq("category", categoryName);

  if (productsError) {
    return NextResponse.json(
      { message: productsError.message },
      { status: 500 }
    );
  }

  if (productsInCategory.length > 0) {
    if (productMoves.length !== productsInCategory.length) {
      return NextResponse.json(
        {
          message:
            "Please choose a new category for every product before deleting.",
        },
        { status: 400 }
      );
    }

    for (const product of productsInCategory) {
      const move = productMoves.find(
        (item: any) => Number(item.productId) === Number(product.id)
      );

      if (!move?.newCategory || move.newCategory === categoryName) {
        return NextResponse.json(
          {
            message: `Please choose a valid new category for ${product.name}.`,
          },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabaseAdmin
        .from("products")
        .update({ category: move.newCategory })
        .eq("id", product.id);

      if (updateError) {
        return NextResponse.json(
          { message: updateError.message },
          { status: 500 }
        );
      }
    }
  }

  const { error: deleteError } = await supabaseAdmin
    .from("categories")
    .delete()
    .eq("name", categoryName);

  if (deleteError) {
    return NextResponse.json(
      { message: deleteError.message },
      { status: 500 }
    );
  }

  if (categoryToDelete?.image) {
    await deleteCategoryImage(categoryToDelete.image);
  }

  return NextResponse.json({ success: true });
}
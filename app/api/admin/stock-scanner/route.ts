import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") || "";

  if (!authHeader.startsWith("Bearer ")) {
    return "";
  }

  return authHeader.replace("Bearer ", "").trim();
}

async function checkAdmin(request: Request) {
  const token = getBearerToken(request);
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  if (!token) {
    return {
      ok: false,
      message: "Admin session missing. Please login again.",
    };
  }

  if (!adminEmail) {
    return {
      ok: false,
      message: "NEXT_PUBLIC_ADMIN_EMAIL missing in .env.local.",
    };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user?.email) {
    return {
      ok: false,
      message: "Admin session expired. Please login again.",
    };
  }

  if (data.user.email !== adminEmail) {
    return {
      ok: false,
      message: "This email is not allowed as admin.",
    };
  }

  return {
    ok: true,
    email: data.user.email,
  };
}

function mapProduct(product: any) {
  return {
    id: product.id,
    name: product.name,
    image: product.image || "",
    category: product.category || "",
    qrCode: product.barcode || "",
    stockQuantity: Number(product.stock_quantity || 0),
  };
}

function mapAdjustment(adjustment: any) {
  return {
    id: adjustment.id,
    createdAt: adjustment.created_at,
    productId: adjustment.product_id,
    productName: adjustment.product_name,
    qrCode: adjustment.qr_code,
    oldStock: Number(adjustment.old_stock || 0),
    quantityReduced: Number(adjustment.quantity_reduced || 0),
    newStock: Number(adjustment.new_stock || 0),
    reason: adjustment.reason || "shop_sale",
  };
}

async function findProductByQr(qrCode: string) {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id, name, image, category, barcode, stock_quantity")
    .eq("barcode", qrCode)
    .limit(2);

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    return {
      product: null,
      duplicate: false,
    };
  }

  if (data.length > 1) {
    return {
      product: null,
      duplicate: true,
    };
  }

  return {
    product: data[0],
    duplicate: false,
  };
}

export async function GET(request: Request) {
  const adminCheck = await checkAdmin(request);

  if (!adminCheck.ok) {
    return NextResponse.json(
      { message: adminCheck.message },
      { status: 401 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("stock_adjustments")
    .select(
      "id, created_at, product_id, product_name, qr_code, old_stock, quantity_reduced, new_stock, reason"
    )
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    adjustments: (data || []).map(mapAdjustment),
  });
}

export async function POST(request: Request) {
  const adminCheck = await checkAdmin(request);

  if (!adminCheck.ok) {
    return NextResponse.json(
      { message: adminCheck.message },
      { status: 401 }
    );
  }

  const body = await request.json();

  const mode = String(body.mode || "lookup");
  const qrCode = String(body.qrCode || "").trim();
  const quantity = Number(body.quantity || 1);

  if (!qrCode) {
    return NextResponse.json(
      { message: "QR / Item code is required." },
      { status: 400 }
    );
  }

  const found = await findProductByQr(qrCode);

  if (found.duplicate) {
    return NextResponse.json(
      {
        message:
          "More than one product has this same QR code. Please fix duplicate QR codes in admin products.",
      },
      { status: 400 }
    );
  }

  if (!found.product) {
    return NextResponse.json(
      {
        message:
          "No product found with this QR code. Check whether this QR / Item code is added in product admin.",
      },
      { status: 404 }
    );
  }

  const product = found.product;
  const currentStock = Number(product.stock_quantity || 0);

  if (mode === "lookup") {
    return NextResponse.json({
      product: mapProduct(product),
    });
  }

  if (mode !== "reduce") {
    return NextResponse.json(
      { message: "Invalid mode." },
      { status: 400 }
    );
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return NextResponse.json(
      { message: "Quantity must be greater than 0." },
      { status: 400 }
    );
  }

  if (quantity > currentStock) {
    return NextResponse.json(
      {
        message: `Only ${currentStock} stock available on website. Cannot reduce ${quantity}.`,
      },
      { status: 400 }
    );
  }

  const newStock = Math.max(currentStock - quantity, 0);

  const { error: updateError } = await supabaseAdmin
    .from("products")
    .update({
      stock_quantity: newStock,
    })
    .eq("id", product.id);

  if (updateError) {
    return NextResponse.json(
      { message: updateError.message },
      { status: 500 }
    );
  }

  const { data: adjustment, error: adjustmentError } = await supabaseAdmin
    .from("stock_adjustments")
    .insert({
      product_id: product.id,
      product_name: product.name,
      qr_code: qrCode,
      old_stock: currentStock,
      quantity_reduced: quantity,
      new_stock: newStock,
      reason: "shop_sale",
      created_by: adminCheck.email || "admin",
    })
    .select(
      "id, created_at, product_id, product_name, qr_code, old_stock, quantity_reduced, new_stock, reason"
    )
    .single();

  if (adjustmentError) {
    return NextResponse.json(
      { message: adjustmentError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    product: {
      ...mapProduct(product),
      stockQuantity: newStock,
    },
    adjustment: mapAdjustment(adjustment),
  });
}
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function verifyAdminRequest(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { message: "Admin login required." },
        { status: 401 }
      ),
    };
  }

  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const { data, error } = await supabaseAuth.auth.getUser(token);

  if (error || !data.user?.email) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { message: "Invalid admin session." },
        { status: 401 }
      ),
    };
  }

  if (data.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { message: "This account is not allowed for admin access." },
        { status: 403 }
      ),
    };
  }

  return {
    user: data.user,
    errorResponse: null,
  };
}
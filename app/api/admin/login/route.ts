import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const password = body.password;

  if (!password) {
    return NextResponse.json(
      { message: "Password is required." },
      { status: 400 }
    );
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { message: "Invalid password." },
      { status: 401 }
    );
  }

  return NextResponse.json({ success: true });
}
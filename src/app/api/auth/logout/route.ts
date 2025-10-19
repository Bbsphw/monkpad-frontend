// src/app/api/auth/logout/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookie = await cookies();
  console.log(cookie.getAll());
  cookie.delete("mp_token");
  return NextResponse.json({ message: "Cookie deleted" });
}

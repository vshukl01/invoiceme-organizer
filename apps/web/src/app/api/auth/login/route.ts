import { NextResponse } from "next/server";
import { verifyLogin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Missing email/password" }, { status: 400 });
    }

    const user = await verifyLogin(email, password);

    // Store user minimal info in httpOnly cookie
    const res = NextResponse.json({ ok: true, user });

    res.cookies.set("invoiceme_user", encodeURIComponent(JSON.stringify(user)), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/"
    });

    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 401 });
  }
}

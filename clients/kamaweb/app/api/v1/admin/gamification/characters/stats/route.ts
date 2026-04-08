import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NODE_ENV !== "production"
    ? process.env.API_URL_LOCAL || "http://localhost:4000"
    : process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL_DEPLOYED ||
      "https://kama-api.vercel.app/api/v1";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = `${BACKEND_URL}/admin/gamification/characters/stats`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: text || "Backend request failed" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Characters stats proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

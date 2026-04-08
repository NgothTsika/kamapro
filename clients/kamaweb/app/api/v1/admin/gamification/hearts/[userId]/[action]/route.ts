import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NODE_ENV !== "production"
    ? process.env.API_URL_LOCAL || "http://localhost:4000"
    : process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL_DEPLOYED ||
      "https://kama-api.vercel.app/api/v1";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; action: string }> },
) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, action } = await params;
    const body = await request.json();
    const url = `${BACKEND_URL}/admin/gamification/hearts/${userId}/${action}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
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
    console.error("Hearts user action proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NODE_ENV !== "production"
    ? process.env.API_URL_LOCAL || "http://localhost:4000"
    : process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL_DEPLOYED ||
      "https://kamapro-one.vercel.app/api/v1";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 },
      );
    }

    const url = `${BACKEND_URL}/admin/gamification/events/${eventId}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`DELETE failed for ${url}:`, text);
      return NextResponse.json(
        { error: text || "Backend request failed" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Events DELETE proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

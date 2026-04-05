import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NODE_ENV !== "production"
    ? process.env.API_URL_LOCAL || "http://localhost:4000"
    : process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL_DEPLOYED ||
      "https://kamapro-one.vercel.app/api/v1";

/**
 * GET /api/v1/users/admin
 * Fetch all admin users
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      console.warn("GET /users/admin - Missing authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = `${BACKEND_URL}/users/admin${request.nextUrl.search}`;
    console.log(`[PROXY] GET ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[PROXY] GET failed: ${response.status} - ${text}`);
      return NextResponse.json(
        { error: text || "Backend request failed" },
        { status: response.status },
      );
    }

    const data = await response.json();
    console.log(
      `[PROXY] GET success - returned ${data.users?.length || 0} users`,
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error("[PROXY] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 },
    );
  }
}

/**
 * POST /api/v1/users/admin
 * Create a new admin user
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      console.warn("POST /users/admin - Missing authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const url = `${BACKEND_URL}/users/admin`;
    console.log(`[PROXY] POST ${url} with body:`, body);

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
      console.error(`[PROXY] POST failed: ${response.status} - ${text}`);
      return NextResponse.json(
        { error: text || "Backend request failed" },
        { status: response.status },
      );
    }

    const data = await response.json();
    console.log("[PROXY] POST success");
    return NextResponse.json(data);
  } catch (error) {
    console.error("[PROXY] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 },
    );
  }
}

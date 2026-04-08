import { NextRequest, NextResponse } from "next/server";

// Get backend URL for API proxying
// In production on Vercel (monorepo): both frontend and backend run on same domain
// The backend Express app runs on a different port but Vercel routes it
const getBackendUrl = () => {
  // For local development
  if (process.env.NODE_ENV !== "production") {
    return process.env.API_URL_LOCAL || "http://localhost:4000";
  }

  // For production, use the configured deployment URL
  // Vercel handles routing between Next.js and Express apps in the same project
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL_DEPLOYED ||
    "https://kama-api.vercel.app/api/v1"
  );
};

const BACKEND_URL = getBackendUrl();

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = `${BACKEND_URL}/auth/email`;

    console.log("Auth email request to:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const contentType = response.headers.get("content-type");
    let data;

    // Check if response is JSON
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error("Non-JSON response from backend:", {
        status: response.status,
        contentType,
        preview: text.substring(0, 200),
      });
      return NextResponse.json(
        { error: "Backend returned invalid response" },
        { status: 502 },
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Authentication failed" },
        { status: response.status },
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Auth email error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

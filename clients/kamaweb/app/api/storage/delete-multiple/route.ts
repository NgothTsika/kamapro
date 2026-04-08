import { NextRequest, NextResponse } from "next/server";

/**
 * Storage Bulk Delete API Route - Proxies to backend
 * POST /api/storage/delete-multiple
 *
 * This is a Next.js API route that proxies bulk file deletion to the backend server.
 */
export async function POST(request: NextRequest) {
  try {
    // Get the backend URL from environment (already includes /api/v1)
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "https://kama-api.vercel.app/api/v1";
    const fullUrl = `${backendUrl}/storage/delete-multiple`;

    // Parse request body
    const body = await request.json();

    // Forward to backend
    const backendResponse = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("Bulk delete proxy error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Bulk delete failed",
      },
      { status: 500 },
    );
  }
}

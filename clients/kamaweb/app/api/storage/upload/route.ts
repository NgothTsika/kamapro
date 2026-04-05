import { NextRequest, NextResponse } from "next/server";

/**
 * Storage Upload API Route - Proxies to backend
 * POST /api/storage/upload
 *
 * This is a Next.js API route that proxies file uploads to the backend server.
 * This allows the frontend to use a simpler API path.
 *
 * The backend server handles:
 * - Service role key authentication
 * - RLS bypassing
 * - File validation
 * - Unique path generation
 * - Supabase storage operations
 */
export async function POST(request: NextRequest) {
  try {
    // Get the backend URL from environment (already includes /api/v1)
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      "https://kamapro-one.vercel.app/api/v1";
    const fullUrl = `${backendUrl}/storage/upload`;

    // Copy headers from the original request
    const forwardHeaders = new Headers();

    // Copy all headers that are needed for multipart/form-data
    for (const [key, value] of request.headers.entries()) {
      // Skip host-related headers that should come from the backend request
      if (
        key.toLowerCase() !== "host" &&
        key.toLowerCase() !== "connection" &&
        key.toLowerCase() !== "content-length" // Will be recalculated
      ) {
        forwardHeaders.set(key, value);
      }
    }

    // Forward the request to backend
    const backendResponse = await fetch(fullUrl, {
      method: "POST",
      body: request.body,
      duplex: "half", // Required for streaming body with fetch
      headers: forwardHeaders,
    } as RequestInit);

    // Get response data
    const data = await backendResponse.json();

    // Return response from backend
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("Upload proxy error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 },
    );
  }
}

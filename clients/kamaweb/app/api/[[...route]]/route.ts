import { NextRequest, NextResponse } from "next/server";

/**
 * Unified API Proxy Route Handler
 *
 * This file handles ALL API requests from the frontend and proxies them to the backend.
 * It consolidates multiple individual route files into a single, centralized proxy.
 *
 * URL Structure:
 * - /api/auth/email → forwards to backend /auth/email
 * - /api/storage/upload → forwards to backend /storage/upload
 * - /api/v1/admin/... → forwards to backend /admin/...
 * - /api/v1/users/... → forwards to backend /users/...
 *
 * Benefits:
 * - Single source of truth for API routing
 * - Consistent error handling
 * - Easier to maintain and debug
 * - Reduced code duplication
 */

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Helper function to check if request needs authentication
 */
function requiresAuth(pathname: string): boolean {
  // Public endpoints that don't require auth
  const publicPaths = ["/auth/email", "/auth/register"];
  return !publicPaths.some((path) => pathname.includes(path));
}

/**
 * Helper function to forward headers appropriately
 */
function createForwardHeaders(
  request: NextRequest,
  isMultipart: boolean = false,
) {
  const forwardHeaders = new Headers();

  if (isMultipart) {
    // For multipart/form-data, copy content-type header
    for (const [key, value] of request.headers.entries()) {
      if (
        key.toLowerCase() !== "host" &&
        key.toLowerCase() !== "connection" &&
        key.toLowerCase() !== "content-length"
      ) {
        forwardHeaders.set(key, value);
      }
    }
  } else {
    // For JSON requests, set standard headers
    forwardHeaders.set("Content-Type", "application/json");

    // Forward authorization header if present
    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      forwardHeaders.set("Authorization", authHeader);
    }
  }

  return forwardHeaders;
}

/**
 * Main handler for all HTTP methods
 */
export async function handler(
  request: NextRequest,
  context: { params: Promise<{ route?: string[] }> },
) {
  try {
    // Reconstruct the path from route params
    const params = await context.params;
    const routeParams = params.route || [];
    const pathname = "/" + routeParams.join("/");
    const searchParams = request.nextUrl.search;

    // Check authentication requirements
    if (requiresAuth(pathname)) {
      const authHeader = request.headers.get("authorization");
      if (!authHeader) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Construct backend URL
    // Strip "/v1/" prefix if present since BACKEND_URL already includes it
    let path = pathname;
    if (path.startsWith("/v1/")) {
      path = path.slice(3); // Remove "/v1"
    }
    const backendUrl = `${BACKEND_URL}${path}${searchParams}`;

    // Determine if this is a multipart request
    const contentType = request.headers.get("content-type") || "";
    const isMultipart = contentType.includes("multipart/form-data");

    // Prepare request options
    const requestOptions: RequestInit & { duplex?: string } = {
      method: request.method,
      headers: createForwardHeaders(request, isMultipart),
    };

    // Handle request body based on content type
    if (request.method !== "GET" && request.method !== "HEAD") {
      if (isMultipart) {
        // For multipart, use the raw body stream
        requestOptions.body = request.body;
        requestOptions.duplex = "half"; // Required for streaming
      } else {
        // For JSON, parse and re-stringify
        if (
          request.method !== "DELETE" ||
          request.headers.get("content-length")
        ) {
          try {
            const body = await request.json();
            requestOptions.body = JSON.stringify(body);
          } catch {
            // If body is not JSON, forward as-is
            requestOptions.body = request.body;
          }
        }
      }
    }

    // Log the request
    console.log(`[API PROXY] ${request.method} ${backendUrl}`);

    // Forward request to backend
    const response = await fetch(backendUrl, requestOptions);

    // Handle response based on content type
    const responseContentType = response.headers.get("content-type") || "";

    let responseBody: unknown;
    if (responseContentType.includes("application/json")) {
      responseBody = await response.json();
    } else if (responseContentType.includes("text/")) {
      responseBody = await response.text();
    } else {
      // For non-text responses, create a passthrough
      return new NextResponse(response.body, {
        status: response.status,
        headers: response.headers,
      });
    }

    // Log response
    console.log(
      `[API PROXY] Response: ${response.status} ${request.method} ${backendUrl}`,
    );

    // Return response
    return NextResponse.json(responseBody, { status: response.status });
  } catch (error) {
    console.error("[API PROXY] Error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message, details: String(error) },
      { status: 500 },
    );
  }
}

// Export all HTTP method handlers
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const HEAD = handler;
export const OPTIONS = (request: NextRequest) => {
  return NextResponse.json({}, { status: 200 });
};

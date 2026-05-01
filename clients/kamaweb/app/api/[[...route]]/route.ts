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

// Get backend URL for API proxying
// The backend URL should be configured per environment
// Environment variables (in priority order):
// 1. NEXT_PUBLIC_BACKEND_URL - Production backend URL (public, safe to expose)
// 2. NEXT_PUBLIC_API_URL - Alternative production URL (deprecated, fallback)
// 3. API_URL_DEPLOYED - Server-side production URL
// 4. API_URL_LOCAL - Local development URL (defaults to localhost:4000)
const getBackendUrl = () => {
  const isDev = process.env.NODE_ENV !== "production";

  // Get the backend URL from environment
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL_DEPLOYED ||
    process.env.API_URL_LOCAL ||
    "http://localhost:4000";

  if (!backendUrl || backendUrl === "http://localhost:4000") {
    console.log(
      "[API PROXY] Using default local backend: http://localhost:4000",
    );
  } else {
    console.log(
      `[API PROXY] ${isDev ? "Development" : "Production"} mode - Using backend: ${backendUrl}`,
    );
  }

  return backendUrl
    .replace(/\/$/, "")
    .replace(/\/api\/v\d+$/, "")
    .replace(/\/api$/, "");
};

const BACKEND_URL = getBackendUrl();

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

function getProxyPath(request: NextRequest, routeParams: string[]): string {
  if (routeParams.length > 0) {
    return `/${routeParams.join("/")}`;
  }

  const fallbackRoute = request.nextUrl.searchParams.get("nxtProute");
  if (fallbackRoute) {
    return `/${fallbackRoute.replace(/^\/+/, "")}`;
  }

  return "/";
}

function getForwardedSearchParams(request: NextRequest): string {
  const searchParams = new URLSearchParams(request.nextUrl.searchParams);
  searchParams.delete("nxtProute");

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
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
    const pathname = getProxyPath(request, routeParams);
    const searchParams = getForwardedSearchParams(request);

    // Check authentication requirements
    if (requiresAuth(pathname)) {
      const authHeader = request.headers.get("authorization");
      if (!authHeader) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Construct backend URL
    // Remove /v1 prefix if present (it's part of the route but not backend path)
    let path = pathname;
    if (path.startsWith("/v1/")) {
      path = path.slice(3); // Remove "/v1"
    }

    // Build the full backend URL
    // BACKEND_URL is now clean (no /api/v1 suffix), so append the path directly
    const backendUrl = `${BACKEND_URL}${path}${searchParams}`;

    console.log(`[API PROXY] Routing: ${pathname} → ${backendUrl}`);

    // Determine if this is a multipart request
    const contentType = request.headers.get("content-type") || "";
    const isMultipart = contentType.includes("multipart/form-data");

    // Prepare request options
    const requestOptions: RequestInit & { duplex?: string } = {
      method: request.method,
      headers: createForwardHeaders(request, isMultipart),
    };
    let parsedBody: unknown = undefined;

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
            parsedBody = await request.json();
            requestOptions.body = JSON.stringify(parsedBody);
          } catch {
            // If body is not JSON, forward as-is
            requestOptions.body = request.body;
          }
        }
      }
    }

    // Log the request
    console.log(`[API PROXY] ${request.method} ${backendUrl}`);
    if (parsedBody !== undefined) {
      console.log("[API PROXY] Request body:", parsedBody);
    }

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
    if (!response.ok) {
      console.error("[API PROXY] Error response body:", responseBody);
    }

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

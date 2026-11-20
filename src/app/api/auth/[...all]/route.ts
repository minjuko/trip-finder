import { toNextJsHandler } from "better-auth/next-js";

import { isTrustedRequestOrigin } from "@/lib/auth/config";
import { getAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function handleAuthRequest(request: Request): Promise<Response> {
  if (
    ["POST", "PUT", "PATCH", "DELETE"].includes(request.method) &&
    !isTrustedRequestOrigin(request.headers.get("origin"))
  ) {
    return Response.json(
      { message: "Untrusted request origin." },
      {
        status: 403,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }

  const handlers = toNextJsHandler(getAuth());
  const handler = request.method === "POST" ? handlers.POST : handlers.GET;
  const response = await handler(request);
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "private, no-store");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function GET(request: Request): Promise<Response> {
  return handleAuthRequest(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleAuthRequest(request);
}

import "server-only";

import { isAuthConfigured, isTrustedRequestOrigin } from "@/lib/auth/config";
import { requireSessionPrincipal } from "@/lib/auth/session";
import { jsonError, toTravelListErrorResponse } from "./errors";

export async function runTravelListRequest(
  request: Request,
  stateChanging: boolean,
  action: (ownerId: string) => Promise<Response>,
): Promise<Response> {
  if (!isAuthConfigured()) {
    return jsonError(503, "AUTH_DISABLED", "Travel lists are not configured.");
  }

  if (stateChanging && !isTrustedRequestOrigin(request.headers.get("origin"))) {
    return jsonError(403, "ORIGIN_FORBIDDEN", "Untrusted request origin.");
  }

  try {
    const principal = await requireSessionPrincipal(request.headers);
    if (principal instanceof Response) {
      return jsonError(
        401,
        "AUTHENTICATION_REQUIRED",
        "Authentication required.",
      );
    }

    const response = await action(principal.userId);
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "private, no-store");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    return toTravelListErrorResponse(error);
  }
}

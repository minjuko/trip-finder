import "server-only";

import { getAuth } from "./index";

export interface SessionPrincipal {
  userId: string;
}

/** Returns only an identity from Better Auth's verified, unexpired server session. */
export async function getSessionPrincipal(
  headers: Headers,
): Promise<SessionPrincipal | null> {
  const result = await getAuth().api.getSession({ headers });
  if (!result?.user?.id || !result.session?.expiresAt) return null;

  const expiresAt = new Date(result.session.expiresAt).getTime();
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;

  return { userId: result.user.id };
}

export async function requireSessionPrincipal(
  headers: Headers,
): Promise<SessionPrincipal | Response> {
  const principal = await getSessionPrincipal(headers);
  if (principal) return principal;

  return Response.json(
    { message: "Authentication required." },
    {
      status: 401,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}

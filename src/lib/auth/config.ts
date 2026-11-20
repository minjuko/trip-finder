import {
  betterAuth,
  type BetterAuthOptions,
  type BetterAuthPlugin,
} from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";

import { authSchema } from "../db/schema";
import { getDb } from "../db/index";

function getAuthEnvironment() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters.");
  }

  const baseUrlValue = process.env.BETTER_AUTH_URL;
  if (!baseUrlValue) {
    throw new Error(
      "BETTER_AUTH_URL must explicitly identify this app origin.",
    );
  }

  const baseUrl = new URL(baseUrlValue);
  if (
    !["http:", "https:"].includes(baseUrl.protocol) ||
    baseUrl.username ||
    baseUrl.password ||
    baseUrl.origin !== baseUrlValue.replace(/\/$/, "")
  ) {
    throw new Error(
      "BETTER_AUTH_URL must be an exact HTTP(S) origin without credentials.",
    );
  }
  if (process.env.NODE_ENV === "production" && baseUrl.protocol !== "https:") {
    throw new Error("BETTER_AUTH_URL must use HTTPS in production.");
  }

  const trustedOrigins = new Set([baseUrl.origin]);
  const configuredOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS;
  for (const value of configuredOrigins?.split(",") ?? []) {
    const candidate = value.trim();
    if (!candidate) continue;
    const origin = new URL(candidate);
    if (
      !["http:", "https:"].includes(origin.protocol) ||
      origin.origin !== candidate ||
      origin.username ||
      origin.password
    ) {
      throw new Error(
        "BETTER_AUTH_TRUSTED_ORIGINS must contain exact HTTP(S) origins only.",
      );
    }
    trustedOrigins.add(origin.origin);
  }

  return {
    secret,
    baseURL: baseUrl.origin,
    trustedOrigins: [...trustedOrigins],
    secureCookies: baseUrl.protocol === "https:",
  };
}

/** Shared schema and adapter configuration; tests may add test-only helpers. */
export function createAuth(
  plugins: NonNullable<BetterAuthOptions["plugins"]> = [],
) {
  const environment = getAuthEnvironment();
  const options = {
    appName: "Trip Finder",
    baseURL: environment.baseURL,
    secret: environment.secret,
    trustedOrigins: environment.trustedOrigins,
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: authSchema,
    }),
    plugins: [...plugins] as BetterAuthPlugin[],
    advanced: {
      useSecureCookies: environment.secureCookies,
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
      },
    },
    telemetry: { enabled: false },
  } satisfies BetterAuthOptions;

  return betterAuth(options);
}

export function isTrustedRequestOrigin(originHeader: string | null): boolean {
  if (!originHeader) return false;
  try {
    const origin = new URL(originHeader);
    const { trustedOrigins } = getAuthEnvironment();
    return (
      origin.origin === originHeader && trustedOrigins.includes(origin.origin)
    );
  } catch {
    return false;
  }
}

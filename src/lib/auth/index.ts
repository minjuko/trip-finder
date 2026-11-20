import "server-only";

import { createAuth } from "./config";

type AuthInstance = ReturnType<typeof createAuth>;

let authInstance: AuthInstance | undefined;

/** Lazily initialize auth so builds and public routes need no DB or auth secrets. */
export function getAuth(): AuthInstance {
  authInstance ??= createAuth();
  return authInstance;
}

export type TravelListErrorCode =
  | "AUTH_DISABLED"
  | "AUTHENTICATION_REQUIRED"
  | "INVALID_JSON"
  | "VALIDATION_ERROR"
  | "ORIGIN_FORBIDDEN"
  | "NOT_FOUND"
  | "VERSION_CONFLICT"
  | "INTERNAL_ERROR";

export class TravelListError extends Error {
  constructor(
    readonly status: number,
    readonly code: TravelListErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "TravelListError";
  }
}

export function jsonError(
  status: number,
  code: TravelListErrorCode,
  message: string,
): Response {
  return Response.json(
    { error: { code, message } },
    {
      status,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}

export function toTravelListErrorResponse(error: unknown): Response {
  if (error instanceof TravelListError) {
    return jsonError(error.status, error.code, error.message);
  }

  return jsonError(500, "INTERNAL_ERROR", "An unexpected error occurred.");
}

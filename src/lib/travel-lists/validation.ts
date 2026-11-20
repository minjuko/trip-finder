import { z } from "zod";

import { TravelListError } from "./errors";

const listName = z.string().trim().min(1).max(80);

export const createTravelListSchema = z.object({ name: listName }).strict();

export const updateTravelListSchema = z
  .object({
    name: listName,
    expectedVersion: z.number().int().min(1).max(2_147_483_647),
  })
  .strict();

export const addTravelListItemSchema = z
  .object({
    contentTypeId: z.string().regex(/^[0-9]{1,8}$/),
    expectedVersion: z.number().int().min(1).max(2_147_483_647),
  })
  .strict();

export const contentIdSchema = z.string().regex(/^[0-9]{1,64}$/);

export const listIdSchema = z.uuid();

const pageQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z.string().min(1).max(512).optional(),
  })
  .strict();

export const cursorPayloadSchema = z
  .object({
    updatedAt: z.iso.datetime(),
    id: z.uuid(),
  })
  .strict();

export const travelListItemsCursorSchema = z
  .object({
    version: z.number().int().min(1).max(2_147_483_647),
    position: z.number().int().min(0).max(2_147_483_647),
    id: z.uuid(),
  })
  .strict();

export function parsePageQuery(searchParams: URLSearchParams) {
  const params: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    if (key !== "limit" && key !== "cursor") {
      throw new TravelListError(400, "VALIDATION_ERROR", "Invalid query.");
    }
    if (Object.hasOwn(params, key)) {
      throw new TravelListError(400, "VALIDATION_ERROR", "Invalid query.");
    }
    params[key] = value;
  }

  const parsed = pageQuerySchema.safeParse(params);
  if (!parsed.success) {
    throw new TravelListError(400, "VALIDATION_ERROR", "Invalid query.");
  }
  return parsed.data;
}

export function parseCursor(value: string) {
  let decoded: unknown;
  try {
    const bytes = Buffer.from(value, "base64url");
    if (bytes.toString("base64url") !== value)
      throw new Error("Invalid cursor");
    decoded = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new TravelListError(400, "VALIDATION_ERROR", "Invalid cursor.");
  }

  const parsed = cursorPayloadSchema.safeParse(decoded);
  if (!parsed.success) {
    throw new TravelListError(400, "VALIDATION_ERROR", "Invalid cursor.");
  }
  return parsed.data;
}

export function encodeCursor(cursor: {
  updatedAt: string;
  id: string;
}): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function parseTravelListItemsCursor(value: string) {
  let decoded: unknown;
  try {
    const bytes = Buffer.from(value, "base64url");
    if (bytes.toString("base64url") !== value)
      throw new Error("Invalid cursor");
    decoded = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new TravelListError(400, "VALIDATION_ERROR", "Invalid cursor.");
  }

  const parsed = travelListItemsCursorSchema.safeParse(decoded);
  if (!parsed.success) {
    throw new TravelListError(400, "VALIDATION_ERROR", "Invalid cursor.");
  }
  return parsed.data;
}

export function encodeTravelListItemsCursor(cursor: {
  version: number;
  position: number;
  id: string;
}): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function parseListVersionMatch(value: string | null): number {
  if (value === null) {
    throw new TravelListError(
      428,
      "PRECONDITION_REQUIRED",
      "If-Match is required.",
    );
  }
  const match = /^"list-v([1-9][0-9]*)"$/.exec(value);
  if (!match) {
    throw new TravelListError(400, "VALIDATION_ERROR", "Invalid If-Match.");
  }
  const version = Number(match[1]);
  if (!Number.isSafeInteger(version) || version > 2_147_483_647) {
    throw new TravelListError(400, "VALIDATION_ERROR", "Invalid If-Match.");
  }
  return version;
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new TravelListError(
      400,
      "INVALID_JSON",
      "Request body must be JSON.",
    );
  }
}

export function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new TravelListError(
      400,
      "VALIDATION_ERROR",
      "Request input is invalid.",
    );
  }
  return parsed.data;
}

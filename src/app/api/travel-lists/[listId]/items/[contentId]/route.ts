import { addVerifiedTravelListItem } from "@/lib/travel-list-items/service";
import { deleteTravelListItem } from "@/lib/travel-list-items/repository";
import { TravelListError } from "@/lib/travel-lists/errors";
import { getTravelList } from "@/lib/travel-lists/repository";
import { runTravelListRequest } from "@/lib/travel-lists/route";
import {
  addTravelListItemSchema,
  contentIdSchema,
  listIdSchema,
  parseInput,
  parseJsonBody,
  parseListVersionMatch,
} from "@/lib/travel-lists/validation";
import type { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = { params: Promise<{ listId: string; contentId: string }> };

function parsePathValue(
  schema: z.ZodType<string>,
  value: string,
  label: string,
) {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new TravelListError(400, "VALIDATION_ERROR", `Invalid ${label}.`);
  }
  return parsed.data;
}

export async function PUT(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  return runTravelListRequest(request, true, async (ownerId) => {
    const params = await context.params;
    const listId = parsePathValue(listIdSchema, params.listId, "list ID");
    const contentId = parsePathValue(
      contentIdSchema,
      params.contentId,
      "content ID",
    );
    const input = parseInput(
      addTravelListItemSchema,
      await parseJsonBody(request),
    );
    const result = await addVerifiedTravelListItem(
      ownerId,
      listId,
      contentId,
      input.contentTypeId,
      input.expectedVersion,
    );
    return Response.json(
      { item: result.item, listVersion: result.listVersion },
      { status: result.status },
    );
  });
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  return runTravelListRequest(request, true, async (ownerId) => {
    const params = await context.params;
    const listId = parsePathValue(listIdSchema, params.listId, "list ID");
    const contentId = parsePathValue(
      contentIdSchema,
      params.contentId,
      "content ID",
    );
    const list = await getTravelList(ownerId, listId);
    if (!list) {
      throw new TravelListError(404, "NOT_FOUND", "Travel list not found.");
    }
    const expectedVersion = parseListVersionMatch(
      request.headers.get("if-match"),
    );
    await deleteTravelListItem(ownerId, listId, contentId, expectedVersion);
    return new Response(null, { status: 204 });
  });
}

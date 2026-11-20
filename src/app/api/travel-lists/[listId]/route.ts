import {
  deleteTravelList,
  getTravelList,
  renameTravelList,
} from "@/lib/travel-lists/repository";
import { TravelListError } from "@/lib/travel-lists/errors";
import { runTravelListRequest } from "@/lib/travel-lists/route";
import {
  listIdSchema,
  parseInput,
  parseJsonBody,
  updateTravelListSchema,
} from "@/lib/travel-lists/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = { params: Promise<{ listId: string }> };

function parseListId(value: string): string {
  const parsed = listIdSchema.safeParse(value);
  if (!parsed.success) {
    throw new TravelListError(400, "VALIDATION_ERROR", "Invalid list ID.");
  }
  return parsed.data;
}

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  return runTravelListRequest(request, false, async (ownerId) => {
    const id = parseListId((await context.params).listId);
    const list = await getTravelList(ownerId, id);
    if (!list) {
      throw new TravelListError(404, "NOT_FOUND", "Travel list not found.");
    }
    return Response.json(list);
  });
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  return runTravelListRequest(request, true, async (ownerId) => {
    const id = parseListId((await context.params).listId);
    const input = parseInput(
      updateTravelListSchema,
      await parseJsonBody(request),
    );
    return Response.json(
      await renameTravelList(ownerId, id, input.name, input.expectedVersion),
    );
  });
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  return runTravelListRequest(request, true, async (ownerId) => {
    const id = parseListId((await context.params).listId);
    const deleted = await deleteTravelList(ownerId, id);
    if (!deleted) {
      throw new TravelListError(404, "NOT_FOUND", "Travel list not found.");
    }
    return new Response(null, { status: 204 });
  });
}

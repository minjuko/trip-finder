import { listTravelListItems } from "@/lib/travel-list-items/repository";
import { TravelListError } from "@/lib/travel-lists/errors";
import { runTravelListRequest } from "@/lib/travel-lists/route";
import { listIdSchema, parsePageQuery } from "@/lib/travel-lists/validation";

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
    const listId = parseListId((await context.params).listId);
    const { limit, cursor } = parsePageQuery(new URL(request.url).searchParams);
    return Response.json(
      await listTravelListItems(ownerId, listId, limit, cursor),
    );
  });
}

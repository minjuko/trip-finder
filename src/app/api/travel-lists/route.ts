import {
  createTravelList,
  listTravelLists,
} from "@/lib/travel-lists/repository";
import { runTravelListRequest } from "@/lib/travel-lists/route";
import {
  createTravelListSchema,
  parseInput,
  parseJsonBody,
  parsePageQuery,
} from "@/lib/travel-lists/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request): Promise<Response> {
  return runTravelListRequest(request, false, async (ownerId) => {
    const { limit, cursor } = parsePageQuery(new URL(request.url).searchParams);
    return Response.json(await listTravelLists(ownerId, limit, cursor));
  });
}

export async function POST(request: Request): Promise<Response> {
  return runTravelListRequest(request, true, async (ownerId) => {
    const input = parseInput(
      createTravelListSchema,
      await parseJsonBody(request),
    );
    const list = await createTravelList(ownerId, input.name);
    return Response.json(list, { status: 201 });
  });
}

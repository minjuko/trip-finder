import "server-only";

import { TourApiError } from "@/lib/tour-api/errors";
import { TravelListError } from "@/lib/travel-lists/errors";
import {
  addTravelListItem,
  getTravelListItemContext,
  type TravelListItemSnapshot,
} from "./repository";

export async function addVerifiedTravelListItem(
  ownerId: string,
  listId: string,
  contentId: string,
  contentTypeId: string,
  expectedVersion: number,
) {
  const current = await getTravelListItemContext(ownerId, listId, contentId);
  if (!current) {
    throw new TravelListError(404, "NOT_FOUND", "Travel list not found.");
  }
  if (current.item) {
    return addTravelListItem(
      ownerId,
      listId,
      contentId,
      contentTypeId,
      expectedVersion,
      current.item.contentTypeId,
      {
        title: current.item.title,
        address: current.item.address,
        thumbnailUrl: current.item.thumbnailUrl,
      },
    );
  }
  if (current.listVersion !== expectedVersion) {
    throw new TravelListError(
      409,
      "VERSION_CONFLICT",
      "Travel list was changed by another request.",
    );
  }

  let detail;
  try {
    const { getTourDetailCommon } =
      await import("@/lib/tour-api/detail-common");
    detail = await getTourDetailCommon(contentId);
  } catch (error) {
    if (error instanceof TravelListError) throw error;
    const timeout = error instanceof TourApiError && error.type === "TIMEOUT";
    throw new TravelListError(
      timeout ? 504 : 503,
      timeout ? "CONTENT_SOURCE_TIMEOUT" : "CONTENT_SOURCE_UNAVAILABLE",
      timeout
        ? "Tour content verification timed out."
        : "Tour content is temporarily unavailable.",
    );
  }

  if (!detail || detail.id !== contentId) {
    throw new TravelListError(
      404,
      "CONTENT_NOT_FOUND",
      "Tour content was not found.",
    );
  }
  if (!detail.title.trim()) {
    throw new TravelListError(
      503,
      "CONTENT_SOURCE_UNAVAILABLE",
      "Tour content is temporarily unavailable.",
    );
  }

  const snapshot: TravelListItemSnapshot = {
    title: detail.title,
    address: detail.address?.primary ?? null,
    thumbnailUrl: detail.thumbnail?.url ?? null,
  };
  return addTravelListItem(
    ownerId,
    listId,
    contentId,
    contentTypeId,
    expectedVersion,
    detail.contentTypeId,
    snapshot,
  );
}

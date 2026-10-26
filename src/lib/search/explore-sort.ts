import type { TourListArrange } from "../tour-api/list-arrange";

export type ExploreSort = "title" | "modified" | "created";

export const getExploreArrange = (
  sort: ExploreSort,
  imageOnly: boolean,
): TourListArrange => {
  if (sort === "modified") {
    return imageOnly ? "Q" : "C";
  }

  if (sort === "created") {
    return imageOnly ? "R" : "D";
  }

  return imageOnly ? "O" : "A";
};

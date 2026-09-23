import type { RepeatingInfoItem } from "@/types/tour";

import type { TourDetailInfoItemDto } from "../schemas/detail-info";

const text = (item: TourDetailInfoItemDto, keys: string[]): string | null => {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

export const normalizeTourDetailInfo = (
  items: TourDetailInfoItemDto[],
): RepeatingInfoItem[] => {
  const seenIds = new Set<string>();

  return items.flatMap((item) => {
    const title = text(item, [
      "subname",
      "infoname",
      "roomtitle",
      "menu",
      "name",
      "fldgubun",
    ]);
    const description = text(item, [
      "subdetailoverview",
      "infotext",
      "roomsize1",
      "roomcount",
      "roomoffseasonminfee1",
      "firstmenu",
      "treatmenu",
    ]);

    if (!title && !description) {
      return [];
    }

    const id = [text(item, ["subcontentid", "contentid"]), title, description]
      .filter((value): value is string => value !== null)
      .join("|");

    if (seenIds.has(id)) {
      return [];
    }

    seenIds.add(id);

    return [
      {
        id,
        title: title ?? "추가 정보",
        description,
      },
    ];
  });
};

import type { RepeatingInfoItem } from "@/types/tour";

import type { TourDetailInfoItemDto } from "../schemas/detail-info";

const text = (
  item: TourDetailInfoItemDto,
  keys: string[],
): string | null => {
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
): RepeatingInfoItem[] =>
  items.flatMap((item, index) => {
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

    return [
      {
        id:
          text(item, ["subcontentid", "contentid"]) ??
          `detail-${index}`,
        title: title ?? "추가 정보",
        description,
      },
    ];
  });

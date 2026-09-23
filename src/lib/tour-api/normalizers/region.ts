import type { RegionOption } from "@/types/tour";

import type { RegionItemDto, RegionResponseDto } from "../schemas/region";

export const normalizeRegionItem = (item: RegionItemDto): RegionOption => ({
  // 변경: 외부 API의 code/name을 Domain 모델로 변환
  code: item.code.trim(),
  name: item.name.trim(),
});

export const normalizeRegionResponse = (
  data: RegionResponseDto,
): RegionOption[] => {
  const { items } = data.response.body;

  if (items === "") {
    return [];
  }

  return items.item.map(normalizeRegionItem);
};

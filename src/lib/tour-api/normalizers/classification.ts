import type { ClassificationOption } from "@/types/tour";

import type {
  ClassificationItemDto,
  ClassificationResponseDto,
} from "../schemas/classification";

export const normalizeClassificationItem = (
  item: ClassificationItemDto,
): ClassificationOption => ({
  code: item.code.trim(),
  name: item.name.trim(),
});

export const normalizeClassificationResponse = (
  data: ClassificationResponseDto,
): ClassificationOption[] => {
  const { items } = data.response.body;

  if (items === "") {
    return [];
  }

  return items.item.map(normalizeClassificationItem);
};
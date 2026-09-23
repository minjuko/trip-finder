import type { TourImage } from "@/types/tour";

import type {
  TourDetailImageItemDto,
  TourDetailImageResponseDto,
} from "../schemas/detail-image";

const emptyToNull = (value: string): string | null => {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
};

export const normalizeTourDetailImageItem = (
  item: TourDetailImageItemDto,
): TourImage | null => {
  const url = emptyToNull(item.originimgurl);

  // 변경: 원본 이미지 URL이 없으면
  // 유효한 TourImage로 취급하지 않음
  if (!url) {
    return null;
  }

  return {
    id: emptyToNull(item.serialnum) ?? url,
    url,
    thumbnailUrl: emptyToNull(item.smallimageurl),
    alt: emptyToNull(item.imgname),
    copyrightType: emptyToNull(item.cpyrhtDivCd),
  };
};

export const normalizeTourDetailImageResponse = (
  data: TourDetailImageResponseDto,
): TourImage[] => {
  const { items } = data.response.body;

  if (items === "") {
    return [];
  }

  return items.item.flatMap((item) => {
    const image = normalizeTourDetailImageItem(item);

    return image ? [image] : [];
  });
};

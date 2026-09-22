import type { TourContent } from "@/types/tour";

import type { TourDetailCommonItemDto } from "../schemas/detail-common";

// 변경: detailCommon2 정규화 결과.
// detailIntro/detailImage 결합 전 중간 Domain 데이터로 사용
export interface TourDetailCommon
  extends TourContent {
  homepage: string | null;
  phone: string | null;
  overview: string | null;
}

const emptyToNull = (
  value: string,
): string | null => {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
};

// 변경: TourAPI homepage HTML 문자열에서 href만 추출
const normalizeHomepage = (
  value: string,
): string | null => {
  const normalized = emptyToNull(value);

  if (!normalized) {
    return null;
  }

  const hrefMatch = normalized.match(
    /href=["']([^"']+)["']/i,
  );

  if (hrefMatch?.[1]) {
    return normalizeExternalUrl(hrefMatch[1]);
  }

  // 변경: API가 향후 일반 URL을 반환하는 경우도 보존
  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://")
  ) {
    return normalizeExternalUrl(normalized);
  }

  return null;
};

export const normalizeTourDetailCommonItem = (
  item: TourDetailCommonItemDto,
): TourDetailCommon => {
  const primaryAddress = emptyToNull(item.addr1);
  const detailAddress = emptyToNull(item.addr2);
  const zipCode = emptyToNull(item.zipcode);

  const thumbnailUrl = emptyToNull(
    item.firstimage,
  );
  const copyrightType = emptyToNull(
    item.cpyrhtDivCd,
  );

  const regionCode = emptyToNull(
    item.lDongRegnCd,
  );
  const districtCode = emptyToNull(
    item.lDongSignguCd,
  );

  const classificationDepth1 = emptyToNull(
    item.lclsSystm1,
  );
  const classificationDepth2 = emptyToNull(
    item.lclsSystm2,
  );
  const classificationDepth3 = emptyToNull(
    item.lclsSystm3,
  );

  const longitude = Number(item.mapx);
  const latitude = Number(item.mapy);

  const hasCoordinates =
    item.mapx.trim() !== "" &&
    item.mapy.trim() !== "" &&
    Number.isFinite(longitude) &&
    Number.isFinite(latitude);

  return {
    id: item.contentid,
    contentTypeId: item.contenttypeid,
    title: item.title.trim(),

    address: primaryAddress
      ? {
          primary: primaryAddress,
          detail: detailAddress,
          zipCode,
        }
      : null,

    thumbnail: thumbnailUrl
      ? {
          url: thumbnailUrl,
          copyrightType,
        }
      : null,

    region:
      regionCode && districtCode
        ? {
            regionCode,
            districtCode,
          }
        : null,

    classification: classificationDepth1
      ? {
          depth1: classificationDepth1,
          depth2: classificationDepth2,
          depth3: classificationDepth3,
        }
      : null,

    coordinates: hasCoordinates
      ? {
          latitude,
          longitude,
        }
      : null,

    homepage: normalizeHomepage(
      item.homepage,
    ),

    phone: emptyToNull(item.tel),

    overview: emptyToNull(item.overview),
  };
};

const normalizeExternalUrl = (
  value: string,
): string | null => {
  try {
    const url = new URL(value.trim());

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
};

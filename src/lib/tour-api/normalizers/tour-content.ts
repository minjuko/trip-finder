import type {
  PaginatedResult,
  TourContent,
} from "@/types/tour";

import type {
  TourListItemDto,
  TourListResponseDto,
} from "../schemas/list";

const emptyToNull = (value: string): string | null => {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
};

export const normalizeTourListItem = (
  item: TourListItemDto,
): TourContent => {
  const primaryAddress = emptyToNull(item.addr1);
  const detailAddress = emptyToNull(item.addr2);
  const zipCode = emptyToNull(item.zipcode);

  const thumbnailUrl = emptyToNull(item.firstimage);
  const copyrightType = emptyToNull(item.cpyrhtDivCd);

  const regionCode = emptyToNull(item.lDongRegnCd);
  const districtCode = emptyToNull(item.lDongSignguCd);

  const classificationDepth1 = emptyToNull(item.lclsSystm1);
  const classificationDepth2 = emptyToNull(item.lclsSystm2);
  const classificationDepth3 = emptyToNull(item.lclsSystm3);

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
  };
};

export const normalizeTourListResponse = (
  data: TourListResponseDto,
): PaginatedResult<TourContent> => {
  const { body } = data.response;

  const items =
    body.items === ""
      ? []
      : body.items.item.map(normalizeTourListItem);

  return {
    items,
    page: body.pageNo,
    pageSize: body.numOfRows,
    totalCount: body.totalCount,
  };
};
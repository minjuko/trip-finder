import type { InformationItem, TourContentDetail } from "@/types/tour";

import { getTourDetailCommon } from "./detail-common";
import { getTourDetailImages } from "./detail-image";
import { getTourDetailInfo } from "./detail-info";
import {
  getTourDetailIntro,
  isSupportedDetailIntroContentTypeId,
} from "./detail-intro";

export const getTourDetail = async (
  contentId: string,
): Promise<TourContentDetail | null> => {
  // 상세정보의 기준 데이터를 먼저 조회
  const common = await getTourDetailCommon(contentId);

  // common이 없으면 존재하지 않는 콘텐츠로 처리.
  // 이후 page 계층에서 Next.js notFound()와 연결
  if (!common) {
    return null;
  }

  // 변경: 실제 응답 계약을 검증한 contentType에서만
  // detailIntro2를 요청하고, 그 외 유형은 공통/이미지 상세만 제공
  const informationPromise: Promise<InformationItem[]> =
    isSupportedDetailIntroContentTypeId(common.contentTypeId)
      ? getTourDetailIntro({
          contentId: common.id,
          contentTypeId: common.contentTypeId,
        })
      : Promise.resolve([]);

  // Intro/image are optional enrichments. A failure in either endpoint should
  // not hide the common detail data that was already loaded successfully.
  const [informationResult, imagesResult, repeatingInformationResult] =
    await Promise.allSettled([
      informationPromise,
      getTourDetailImages(common.id),
      getTourDetailInfo({
        contentId: common.id,
        contentTypeId: common.contentTypeId,
      }),
    ]);

  const information =
    informationResult.status === "fulfilled" ? informationResult.value : [];
  const images = imagesResult.status === "fulfilled" ? imagesResult.value : [];
  const repeatingInformation =
    repeatingInformationResult.status === "fulfilled"
      ? repeatingInformationResult.value
      : [];

  return {
    ...common,
    information,
    images,
    repeatingInformation,
  };
};

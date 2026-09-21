import type { TourContentDetail } from "@/types/tour";

import { getTourDetailCommon } from "./detail-common";
import { getTourDetailImages } from "./detail-image";
import { getTourDetailIntro } from "./detail-intro";

export const getTourDetail = async (
  contentId: string,
): Promise<TourContentDetail | null> => {
  // 변경: 상세정보의 기준 데이터를 먼저 조회
  const common =
    await getTourDetailCommon(contentId);

  // 변경: common이 없으면 존재하지 않는 콘텐츠로 처리.
  // 이후 page 계층에서 Next.js notFound()와 연결
  if (!common) {
    return null;
  }

  // 변경: 외부 입력이 아니라 detailCommon2에서 확인한
  // 실제 contentTypeId를 detailIntro2 요청에 사용
  const [information, images] =
    await Promise.all([
      getTourDetailIntro({
        contentId: common.id,
        contentTypeId:
          common.contentTypeId,
      }),
      getTourDetailImages(common.id),
    ]);

  return {
    ...common,
    information,
    images,
  };
};
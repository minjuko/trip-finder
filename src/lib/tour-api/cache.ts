// endpoint 성격에 따라 재사용할 TourAPI 캐시 정책 정의

export const TOUR_API_CACHE = {
  // 지역/분류 코드는 변경 빈도가 매우 낮음
  CODE: {
    revalidate: 60 * 60 * 24,
  },

  // 관광 콘텐츠 목록/검색 결과는 코드 데이터보다 짧게 유지
  CONTENT_LIST: {
    revalidate: 60 * 10,
  },

  // 변경: 개별 관광 콘텐츠 상세정보는 1시간 재검증
  CONTENT_DETAIL: {
    revalidate: 60 * 60,
  },
} as const;

export type TourApiCacheOptions =
  | {
      revalidate: number;
    }
  | {
      cache: "no-store";
    };

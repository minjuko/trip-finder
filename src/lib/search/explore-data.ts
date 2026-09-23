import type { PaginatedResult, TourContent } from "@/types/tour";

import { getAreaBasedList } from "../tour-api/area-based-list";
import { searchKeyword } from "../tour-api/search-keyword";
import type { ExploreQuery } from "./explore-query";

const EXPLORE_PAGE_SIZE = 12;

export interface ExploreData {
  contents: PaginatedResult<TourContent>;
}

export const getExploreData = async (
  query: ExploreQuery,
): Promise<ExploreData> => {
  // 변경: 지역과 분류 filter를 두 endpoint에서 공통으로 사용
  const filters = {
    regionCode: query.region ?? undefined,
    districtCode: query.district ?? undefined,
    classificationDepth1: query.category1 ?? undefined,
    classificationDepth2: query.category2 ?? undefined,
    classificationDepth3: query.category3 ?? undefined,
    page: query.page,
    pageSize: EXPLORE_PAGE_SIZE,
  };

  const contents = query.keyword
    ? await searchKeyword({
        keyword: query.keyword,
        ...filters,
      })
    : await getAreaBasedList(filters);

  return {
    contents,
  };
};

import { ExploreClassificationFilter } from "@/components/search/ExploreClassificationFilter";
import { ExploreRegionFilter } from "@/components/search/ExploreRegionFilter";
import { ExploreSearch } from "@/components/search/ExploreSearch";
import { TourList } from "@/components/tour/TourList";
import { getExploreData } from "@/lib/search/explore-data";
import {
  parseExploreQuery,
  type ExploreSearchParams,
} from "@/lib/search/explore-query";
import { getClassifications } from "@/lib/tour-api/classification";
import { getRegions } from "@/lib/tour-api/region";

interface ExplorePageProps {
  searchParams: Promise<ExploreSearchParams>;
}

const ExplorePage = async ({
  searchParams,
}: ExplorePageProps) => {
  const rawSearchParams = await searchParams;
  const query = parseExploreQuery(rawSearchParams);

  // 변경: 콘텐츠, 지역, 대분류는 서로 독립적이므로 병렬 조회
  const [
    regions,
    depth1Options,
    { contents },
  ] = await Promise.all([
    getRegions(),
    getClassifications(),
    getExploreData(query),
  ]);

  return (
    <main>
      <header>
        <h1>여행지 탐색</h1>
        <p>
          지역과 카테고리를 선택하거나 키워드로 국내 관광
          콘텐츠를 찾아보세요.
        </p>
      </header>

      <ExploreSearch
        initialKeyword={query.keyword}
      />

      <ExploreRegionFilter
        regions={regions}
        initialRegion={query.region}
        initialDistrict={query.district}
      />

      {/* 변경: 대분류는 서버에서 전달하고 하위 분류만 동적 조회 */}
      <ExploreClassificationFilter
        depth1Options={depth1Options}
        initialDepth1={query.category1}
        initialDepth2={query.category2}
        initialDepth3={query.category3}
      />

      <p aria-live="polite">
        총 {contents.totalCount.toLocaleString("ko-KR")}개의
        관광 콘텐츠
      </p>

      <TourList contents={contents.items} />
    </main>
  );
};

export default ExplorePage;

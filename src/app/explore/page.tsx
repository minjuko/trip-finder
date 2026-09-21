import { TourList } from "@/components/tour/TourList";
import { getExploreData } from "@/lib/search/explore-data";
import {
  parseExploreQuery,
  type ExploreSearchParams,
} from "@/lib/search/explore-query";

interface ExplorePageProps {
  // 변경: Next.js App Router의 비동기 searchParams를 명시적으로 처리
  searchParams: Promise<ExploreSearchParams>;
}

const ExplorePage = async ({
  searchParams,
}: ExplorePageProps) => {
  // 변경: URL 입력을 먼저 애플리케이션 Query Model로 정규화
  const rawSearchParams = await searchParams;
  const query = parseExploreQuery(rawSearchParams);

  // 변경: Server Component에서 TourAPI 데이터 조회
  const { contents } = await getExploreData(query);

  return (
    <main>
      <header>
        <h1>여행지 탐색</h1>
        <p>
          지역과 카테고리를 선택하거나 키워드로 국내 관광
          콘텐츠를 찾아보세요.
        </p>
      </header>

      {/* 변경: 현재 조회 결과 수를 화면과 보조기술에 전달 */}
      <p aria-live="polite">
        총 {contents.totalCount.toLocaleString("ko-KR")}개의
        관광 콘텐츠
      </p>

      <TourList contents={contents.items} />
    </main>
  );
};

export default ExplorePage;
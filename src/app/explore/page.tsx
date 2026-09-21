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
import { ExplorePagination } from "@/components/search/ExplorePagination";

interface ExplorePageProps {
  searchParams: Promise<ExploreSearchParams>;
}

const ExplorePage = async ({ searchParams }: ExplorePageProps) => {
  const rawSearchParams = await searchParams;
  const query = parseExploreQuery(rawSearchParams);

  const [regions, depth1Options, { contents }] = await Promise.all([
    getRegions(),
    getClassifications(),
    getExploreData(query),
  ]);

  return (
    // 변경: Desktop-first 최대 너비와 페이지 여백 적용
    <main className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8">
      {/* 변경: 페이지 소개 영역 */}
      <header className="mb-8">
        <p className="mb-2 text-sm font-semibold text-slate-500">EXPLORE</p>

        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          여행지 탐색
        </h1>

        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          지역과 카테고리를 선택하거나 키워드로 국내 관광 콘텐츠를 찾아보세요.
        </p>
      </header>

      {/* 변경: 검색창은 sidebar와 결과 영역 위에서 전체 너비 사용 */}
      <div className="mb-8">
        <ExploreSearch initialKeyword={query.keyword} />
      </div>

      {/* 변경: Desktop에서 sidebar + results 2-column layout */}
      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside
          className="h-fit rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-6"
          aria-label="여행지 검색 필터"
        >
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-950">필터</h2>

            <p className="mt-1 text-sm text-slate-500">
              원하는 여행 조건을 선택하세요.
            </p>
          </div>

          <div className="space-y-6">
            <ExploreRegionFilter
              regions={regions}
              initialRegion={query.region}
              initialDistrict={query.district}
            />

            <div className="border-t border-slate-200" />

            <ExploreClassificationFilter
              depth1Options={depth1Options}
              initialDepth1={query.category1}
              initialDepth2={query.category2}
              initialDepth3={query.category3}
            />
          </div>
        </aside>

        {/* 변경: 검색 결과 영역 */}
        <section aria-labelledby="explore-results-title" className="min-w-0">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2
                id="explore-results-title"
                className="text-xl font-semibold text-slate-950"
              >
                검색 결과
              </h2>

              <p className="mt-1 text-sm text-slate-500" aria-live="polite">
                총{" "}
                <strong className="font-semibold text-slate-900">
                  {contents.totalCount.toLocaleString("ko-KR")}
                </strong>
                개의 관광 콘텐츠
              </p>
            </div>

            <p className="shrink-0 text-sm text-slate-500">
              {contents.page}페이지
            </p>
          </div>

          <TourList contents={contents.items} />

          <ExplorePagination
            query={query}
            totalCount={contents.totalCount}
            pageSize={contents.pageSize}
          />
        </section>
      </div>
    </main>
  );
};

export default ExplorePage;

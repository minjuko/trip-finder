import { ExploreClassificationFilter } from "@/components/search/ExploreClassificationFilter";
import { ExplorePagination } from "@/components/search/ExplorePagination";
import { ExploreRegionFilter } from "@/components/search/ExploreRegionFilter";
import { ExploreSearch } from "@/components/search/ExploreSearch";
import { TourList } from "@/components/tour/TourList";
import { getExploreData } from "@/lib/search/explore-data";
import {
  parseExploreQuery,
  type ExploreSearchParams,
} from "@/lib/search/explore-query";
import { getClassificationOptions } from "@/lib/tour-api/classification";
import { getRegions } from "@/lib/tour-api/region";

interface ExplorePageProps {
  searchParams: Promise<ExploreSearchParams>;
}

const ExplorePage = async ({
  searchParams,
}: ExplorePageProps) => {
  const rawSearchParams =
    await searchParams;

  const query = parseExploreQuery(
    rawSearchParams,
  );

  const [
    regions,
    depth1Options,
    { contents },
  ] = await Promise.all([
    getRegions(),
    getClassificationOptions(),
    getExploreData(query),
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8">
      <header className="mb-8">
        <p className="mb-2 text-sm font-semibold text-slate-500">
          EXPLORE
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          여행지 탐색
        </h1>

        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          지역과 카테고리를 선택하거나
          키워드로 국내 관광 콘텐츠를
          찾아보세요.
        </p>
      </header>

      <div className="mb-8">
        <ExploreSearch
          initialKeyword={
            query.keyword
          }
        />
      </div>

      {/* 변경: 작은 화면에서는 filter → result 순서,
          Desktop에서는 sidebar + results */}
      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside
          className="h-fit rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-6"
          aria-label="여행지 검색 필터"
        >
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-950">
              필터
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              원하는 여행 조건을
              선택하세요.
            </p>
          </div>

          {/* 변경: Tablet에서는 필터 두 종류를 가로 배치,
              Desktop sidebar에서는 다시 세로 배치 */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
            <ExploreRegionFilter
              regions={regions}
              initialRegion={
                query.region
              }
              initialDistrict={
                query.district
              }
            />

            <div className="hidden border-t border-slate-200 lg:block" />

            <ExploreClassificationFilter
              depth1Options={
                depth1Options
              }
              initialDepth1={
                query.category1
              }
              initialDepth2={
                query.category2
              }
              initialDepth3={
                query.category3
              }
            />
          </div>
        </aside>

        <section
          aria-labelledby="explore-results-title"
          className="min-w-0"
        >
          {/* 변경: 좁은 화면에서 결과 수와 페이지가 충돌하지 않도록 wrapping */}
          <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <div>
              <h2
                id="explore-results-title"
                className="text-xl font-semibold text-slate-950"
              >
                검색 결과
              </h2>

              <p
                className="mt-1 text-sm text-slate-500"
                aria-live="polite"
              >
                총{" "}
                <strong className="font-semibold text-slate-900">
                  {contents.totalCount.toLocaleString(
                    "ko-KR",
                  )}
                </strong>
                개의 관광 콘텐츠
              </p>
            </div>

            <p className="shrink-0 text-sm text-slate-500">
              {contents.page}페이지
            </p>
          </div>

          <TourList
            contents={contents.items}
          />

          <ExplorePagination
            query={query}
            totalCount={
              contents.totalCount
            }
            pageSize={
              contents.pageSize
            }
          />
        </section>
      </div>
    </main>
  );
};

export default ExplorePage;
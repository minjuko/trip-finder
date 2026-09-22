import { ExploreActiveFilters } from "@/components/search/ExploreActiveFilters";
import type { Metadata } from "next";
import { ExploreClassificationFilter } from "@/components/search/ExploreClassificationFilter";
import { ExplorePagination } from "@/components/search/ExplorePagination";
import { ExploreRegionFilter } from "@/components/search/ExploreRegionFilter";
import { ExploreSearch } from "@/components/search/ExploreSearch";
import { ExploreSortSelect } from "@/components/search/ExploreSortSelect";
import { ExploreViewToggle } from "@/components/search/ExploreViewToggle";
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

export const metadata: Metadata = {
  title: "여행지 탐색",
  description:
    "지역, 카테고리, 키워드로 국내 여행지를 찾아보세요.",
};

const ExplorePage = async ({
  searchParams,
}: ExplorePageProps) => {
  const rawSearchParams =
    await searchParams;

  const query = parseExploreQuery(
    rawSearchParams,
  );

  const [regionsResult, depth1Result, exploreResult] =
    await Promise.allSettled([
      getRegions(),
      getClassificationOptions(),
      getExploreData(query),
    ]);

  // Filter metadata is optional. Keep the result view usable when a code
  // endpoint is temporarily unavailable; the selected query still renders.
  const regions =
    regionsResult.status === "fulfilled"
      ? regionsResult.value
      : [];
  const depth1Options =
    depth1Result.status === "fulfilled"
      ? depth1Result.value
      : [];

  // Search results are the primary page content. Preserve the existing error
  // boundary behavior when the primary request fails.
  if (exploreResult.status === "rejected") {
    throw exploreResult.reason;
  }

  const { contents } = exploreResult.value;
  const visibleContents =
    query.sort === "title"
      ? [...contents.items].sort((a, b) =>
          a.title.localeCompare(b.title, "ko"),
        )
      : contents.items;
  const activeFilterCount = [
    query.keyword,
    query.region,
    query.district,
    query.category1,
    query.category2,
    query.category3,
  ].filter(Boolean).length;

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
      <header className="mb-9">
        <p className="mb-3 text-xs font-bold tracking-[0.16em] text-brand">
          EXPLORE
        </p>

        <h1 className="text-4xl font-bold tracking-[-0.05em] text-slate-950 sm:text-5xl">
          여행지 탐색
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-7 text-ink-muted">
          지역과 카테고리를 선택하거나
          키워드로 국내 관광 콘텐츠를
          찾아보세요.
        </p>
      </header>

      <div className="mb-10">
        <ExploreSearch
          initialKeyword={
            query.keyword
          }
        />
      </div>

      {/* 변경: 작은 화면에서는 filter → result 순서,
          Desktop에서는 sidebar + results */}
      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
        <aside
          className="h-fit rounded-3xl border border-line bg-white shadow-sm shadow-slate-200/40 lg:sticky lg:top-24"
          aria-label="여행지 검색 필터"
        >
          <details open className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-3xl p-5 text-lg font-bold tracking-tight text-slate-950 outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 lg:hidden">
              <span className="flex items-center gap-2">
                필터
                {activeFilterCount > 0 ? (
                  <span className="grid size-5 place-items-center rounded-full bg-brand text-[11px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                ) : null}
              </span>
              <span aria-hidden="true" className="text-xl font-normal text-slate-500 transition group-open:rotate-180">⌄</span>
            </summary>

            <div className="px-5 pb-6 lg:p-6">
              <div className="mb-5 hidden lg:block">
                <h2 className="text-lg font-bold tracking-tight text-slate-950">
                  필터
                </h2>

                <p className="mt-1 text-sm leading-6 text-ink-muted">
                  원하는 여행 조건을 선택하세요.
                </p>
              </div>

              {/* Tablet에서는 필터 두 종류를 가로 배치, Desktop에서는 세로 배치 */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
                <ExploreRegionFilter
                  regions={regions}
                  initialRegion={query.region}
                  initialDistrict={query.district}
                />

                <div className="hidden border-t border-line lg:block" />

                <ExploreClassificationFilter
                  depth1Options={depth1Options}
                  initialDepth1={query.category1}
                  initialDepth2={query.category2}
                  initialDepth3={query.category3}
                />
              </div>
            </div>
          </details>
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
                className="text-2xl font-bold tracking-[-0.04em] text-slate-950"
              >
                검색 결과
              </h2>

              <p
                className="mt-1 text-sm text-ink-muted"
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

            <div className="flex flex-wrap items-center gap-3">
              <ExploreSortSelect sort={query.sort} />
              <p className="rounded-full bg-surface-subtle px-3 py-1.5 text-xs font-semibold text-slate-600">
                PAGE {contents.page}
              </p>
              <ExploreViewToggle view={query.view} />
            </div>
          </div>

          <ExploreActiveFilters query={query} />

          <TourList
            contents={visibleContents}
            view={query.view}
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

import Link from "next/link";

import type {
  ExploreQuery,
} from "@/lib/search/explore-query";

interface ExplorePaginationProps {
  query: ExploreQuery;
  totalCount: number;
  pageSize: number;
}

const getExploreHref = (
  query: ExploreQuery,
  page: number,
): string => {
  const params = new URLSearchParams();

  // 변경: 현재 검색/필터 조건을 모두 URL에 보존
  if (query.region) {
    params.set("region", query.region);
  }

  if (query.district) {
    params.set("district", query.district);
  }

  if (query.category1) {
    params.set("category1", query.category1);
  }

  if (query.category2) {
    params.set("category2", query.category2);
  }

  if (query.category3) {
    params.set("category3", query.category3);
  }

  if (query.keyword) {
    params.set("keyword", query.keyword);
  }

  if (query.view !== "grid") {
    params.set("view", query.view);
  }

  if (query.sort !== "relevance") {
    params.set("sort", query.sort);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const queryString = params.toString();

  return queryString
    ? `/explore?${queryString}`
    : "/explore";
};

export const ExplorePagination = ({
  query,
  totalCount,
  pageSize,
}: ExplorePaginationProps) => {
  const totalPages = Math.ceil(
    totalCount / pageSize,
  );

  // 변경: 결과가 한 페이지 이하라면 pagination 자체를 표시하지 않음
  if (totalPages <= 1) {
    return null;
  }

  const currentPage = Math.min(
    query.page,
    totalPages,
  );

  const previousPage =
    currentPage > 1
      ? currentPage - 1
      : null;

  const nextPage =
    currentPage < totalPages
      ? currentPage + 1
      : null;

  return (
    <nav
      aria-label="검색 결과 페이지"
      className="mt-10 flex items-center justify-center gap-4"
    >
      {previousPage ? (
        <Link
          href={getExploreHref(
            query,
            previousPage,
          )}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
        >
          이전
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400"
        >
          이전
        </span>
      )}

      <p className="text-sm text-slate-600">
        <strong className="font-semibold text-slate-950">
          {currentPage}
        </strong>
        {" / "}
        {totalPages.toLocaleString("ko-KR")}
      </p>

      {nextPage ? (
        <Link
          href={getExploreHref(
            query,
            nextPage,
          )}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
        >
          다음
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400"
        >
          다음
        </span>
      )}
    </nav>
  );
};

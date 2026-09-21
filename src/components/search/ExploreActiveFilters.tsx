import Link from "next/link";

import { CATEGORY_LABELS, REGION_LABELS } from "@/constants/tour-labels";
import type { ExploreQuery } from "@/lib/search/explore-query";

interface ExploreActiveFiltersProps {
  query: ExploreQuery;
}

const buildHref = (
  query: ExploreQuery,
  remove: Array<keyof ExploreQuery>,
): string => {
  const params = new URLSearchParams();

  const entries: Array<[keyof ExploreQuery, string | number | null]> = [
    ["region", query.region],
    ["district", query.district],
    ["category1", query.category1],
    ["category2", query.category2],
    ["category3", query.category3],
    ["keyword", query.keyword],
    ["page", query.page],
  ];

  entries.forEach(([key, value]) => {
    if (remove.includes(key) || value === null) {
      return;
    }

    if (key === "page" && value === 1) {
      return;
    }

    params.set(key, String(value));
  });

  params.delete("page");

  const queryString = params.toString();
  return queryString ? `/explore?${queryString}` : "/explore";
};

export const ExploreActiveFilters = ({
  query,
}: ExploreActiveFiltersProps) => {
  const filters = [
    query.keyword
      ? {
          key: "keyword",
          label: `“${query.keyword}”`,
          href: buildHref(query, ["keyword"]),
        }
      : null,
    query.region
      ? {
          key: "region",
          label: query.district
            ? `${REGION_LABELS[query.region] ?? "지역"} · 시군구`
            : REGION_LABELS[query.region] ?? "지역",
          href: buildHref(query, ["region", "district"]),
        }
      : null,
    query.category1
      ? {
          key: "category",
          label:
            CATEGORY_LABELS[query.category1] ??
            "카테고리",
          href: buildHref(query, [
            "category1",
            "category2",
            "category3",
          ]),
        }
      : null,
  ].filter(
    (
      filter,
    ): filter is {
      key: string;
      label: string;
      href: string;
    } => filter !== null,
  );

  if (filters.length === 0) {
    return null;
  }

  return (
    <div
      className="mb-6 flex flex-wrap items-center gap-2"
      aria-label="적용된 검색 조건"
    >
      <span className="mr-1 text-xs font-semibold text-slate-500">
        적용된 조건
      </span>

      {filters.map((filter) => (
        <Link
          key={filter.key}
          href={filter.href}
          aria-label={`${filter.label} 조건 제거`}
          className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand transition hover:border-teal-300 hover:bg-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          {filter.label}
          <span aria-hidden="true">×</span>
        </Link>
      ))}

      <Link
        href="/explore"
        className="ml-1 text-xs font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        전체 초기화
      </Link>
    </div>
  );
};

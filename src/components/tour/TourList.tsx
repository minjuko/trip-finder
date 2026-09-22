import type { TourContent } from "@/types/tour";
import Link from "next/link";

import { TourCard } from "./TourCard";

interface TourListProps {
  contents: TourContent[];
  view?: "grid" | "list";
  emptyActionHref?: string;
}

export const TourList = ({
  contents,
  view = "grid",
  emptyActionHref,
}: TourListProps) => {
  if (contents.length === 0) {
    return (
      // 변경: 명확한 empty state
      <div className="flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-line bg-surface-subtle px-6 text-center">
        <div>
          <p className="font-semibold text-slate-900">
            조건에 맞는 여행지가 없습니다.
          </p>

          <p className="mt-2 text-sm text-slate-500">
            검색어나 필터를 변경해 보세요.
          </p>
          {emptyActionHref ? (
            <Link
              href={emptyActionHref}
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              필터 전체 초기화
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    // 변경: Desktop 3-column 결과 grid
    <ul
      className={
        view === "list"
          ? "grid grid-cols-1 gap-4"
          : "grid grid-cols-1 gap-x-5 gap-y-7 md:grid-cols-2 xl:grid-cols-3"
      }
    >
      {contents.map((content, index) => (
        <li key={content.id}>
          <TourCard
            content={content}
            layout={view}
            // Only the first result is a likely LCP candidate. Keeping the
            // rest lazy avoids turning a 12-card page into eager downloads.
            isAboveFold={index === 0}
          />
        </li>
      ))}
    </ul>
  );
};

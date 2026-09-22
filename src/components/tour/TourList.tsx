import type { TourContent } from "@/types/tour";

import { TourCard } from "./TourCard";

interface TourListProps {
  contents: TourContent[];
}

export const TourList = ({ contents }: TourListProps) => {
  if (contents.length === 0) {
    return (
      // 변경: 명확한 empty state
      <div className="flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
        <div>
          <p className="font-semibold text-slate-900">
            조건에 맞는 관광 콘텐츠가 없습니다.
          </p>

          <p className="mt-2 text-sm text-slate-500">
            검색어나 필터 조건을 변경해보세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    // 변경: Desktop 3-column 결과 grid
    <ul className="grid grid-cols-1 gap-x-5 gap-y-7 md:grid-cols-2 xl:grid-cols-3">
      {contents.map((content, index) => (
        <li key={content.id}>
          <TourCard
            content={content}
            // Only the first result is a likely LCP candidate. Keeping the
            // rest lazy avoids turning a 12-card page into eager downloads.
            isAboveFold={index === 0}
          />
        </li>
      ))}
    </ul>
  );
};

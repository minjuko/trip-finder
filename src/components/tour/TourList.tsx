import type { TourContent } from "@/types/tour";

import { TourCard } from "./TourCard";

interface TourListProps {
  contents: TourContent[];
}

export const TourList = ({ contents }: TourListProps) => {
  // 변경: API 정상 응답이지만 검색 결과가 없는 상태를 별도로 표현
  if (contents.length === 0) {
    return (
      <section aria-labelledby="tour-results-heading">
        <h2 id="tour-results-heading">검색 결과</h2>
        <p>조건에 맞는 관광 콘텐츠가 없습니다.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="tour-results-heading">
      <h2 id="tour-results-heading">검색 결과</h2>

      {/* 변경: 관광 콘텐츠 collection을 의미론적인 목록으로 표현 */}
      <ul>
        {contents.map((content) => (
          <li key={content.id}>
            <TourCard content={content} />
          </li>
        ))}
      </ul>
    </section>
  );
};
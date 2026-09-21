import Link from "next/link";

import type { TourContent } from "@/types/tour";

interface TourCardProps {
  content: TourContent;
}

export const TourCard = ({ content }: TourCardProps) => {
  const address = content.address?.primary ?? "주소 정보 없음";

  return (
    // 변경: 상세 페이지로 이동 가능한 관광 콘텐츠 카드
    <article>
      <Link
        href={`/places/${content.id}`}
        aria-label={`${content.title} 상세정보 보기`}
      >
        {content.thumbnail ? (
          // 변경: 외부 이미지 도메인 설정 전까지 native img로 최소 렌더링
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={content.thumbnail.url}
            alt=""
            width={400}
            height={225}
          />
        ) : (
          // 변경: 이미지가 없는 데이터의 명시적인 fallback
          <div aria-hidden="true">이미지 없음</div>
        )}

        <div>
          <h2>{content.title}</h2>
          <p>{address}</p>
        </div>
      </Link>
    </article>
  );
};
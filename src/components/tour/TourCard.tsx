import Image from "next/image";
import Link from "next/link";

import type { TourContent } from "@/types/tour";

interface TourCardProps {
  content: TourContent;
}

export const TourCard = ({
  content,
}: TourCardProps) => {
  const address =
    content.address?.primary ?? "주소 정보 없음";

  return (
    <article className="h-full">
      <Link
        href={`/places/${content.id}`}
        aria-label={`${content.title} 상세정보 보기`}
        className="group block h-full overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {content.thumbnail ? (
            // 변경: native img → Next.js Image
            <Image
              src={content.thumbnail.url}
              alt=""
              fill
              sizes="(min-width: 1280px) 280px, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            // 변경: API에 이미지가 없는 콘텐츠의 fallback 유지
            <div
              aria-hidden="true"
              className="flex h-full items-center justify-center text-sm text-slate-600"
            >
              이미지 없음
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="line-clamp-2 text-base font-semibold leading-6 text-slate-950">
            {content.title}
          </h3>

          <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500">
            {address}
          </p>
        </div>
      </Link>
    </article>
  );
};

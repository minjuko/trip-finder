import Image from "next/image";
import Link from "next/link";

import { CATEGORY_LABELS, REGION_LABELS } from "@/constants/tour-labels";
import type { TourContent } from "@/types/tour";
import { BookmarkButton } from "@/components/bookmark/BookmarkButton";
import { Icon } from "@/components/ui/Icon";

interface TourCardProps {
  content: TourContent;
  isAboveFold?: boolean;
  layout?: "grid" | "list";
}

export const TourCard = ({
  content,
  isAboveFold = false,
  layout = "grid",
}: TourCardProps) => {
  const address = content.address?.primary ?? "주소 정보 없음";
  const regionLabel = content.region
    ? REGION_LABELS[content.region.regionCode]
    : null;
  const categoryLabel = content.classification
    ? CATEGORY_LABELS[content.classification.depth1]
    : null;

  return (
    <article className="relative h-full">
      <Link
        href={`/places/${content.id}`}
        aria-label={`${content.title} 상세정보 보기`}
        className={`${layout === "list" ? "flex flex-col sm:flex-row" : "block"} group h-full overflow-hidden rounded-3xl border border-line bg-white transition duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-xl hover:shadow-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2`}
      >
        <div className={`${layout === "list" ? "aspect-[4/3] sm:h-44 sm:w-64 sm:shrink-0 sm:aspect-auto" : "aspect-[4/3]"} relative overflow-hidden bg-surface-subtle`}>
          {content.thumbnail ? (
            <Image
              src={content.thumbnail.url}
              alt=""
              fill
              loading={isAboveFold ? "eager" : "lazy"}
              sizes={layout === "list" ? "(min-width: 640px) 256px, 100vw" : "(min-width: 1280px) 280px, (min-width: 768px) 50vw, 100vw"}
              className="object-cover transition duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div
              aria-label="대표 이미지 준비 중"
              className="flex h-full items-center justify-center bg-surface-subtle text-slate-500"
            >
              <div className="grid place-items-center gap-2 text-center">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
                  <Icon name="compass" size={20} />
                </span>
                <span className="text-xs font-medium text-slate-600">등록된 이미지가 없습니다</span>
                <span className="sr-only">이미지 없음</span>
              </div>
            </div>
          )}

          {regionLabel ? (
            <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-800 shadow-sm backdrop-blur">
              {regionLabel}
            </span>
          ) : null}
        </div>

        <div className="min-w-0 p-5 sm:p-6">
          {categoryLabel ? (
            <p className="mb-2 text-xs font-bold tracking-wide text-brand">
              {categoryLabel}
            </p>
          ) : null}

          <h3 className="line-clamp-2 text-base font-semibold leading-6 text-slate-950 transition group-hover:text-brand-strong">
            {content.title}
          </h3>

          <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500">
            {address}
          </p>
        </div>
      </Link>

      <div className="absolute right-3 top-3 z-10">
        <BookmarkButton content={content} compact />
      </div>
    </article>
  );
};

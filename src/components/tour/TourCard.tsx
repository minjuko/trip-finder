import Image from "next/image";
import Link from "next/link";

import { CATEGORY_LABELS, REGION_LABELS } from "@/constants/tour-labels";
import type { TourContent } from "@/types/tour";

interface TourCardProps {
  content: TourContent;
  isAboveFold?: boolean;
}

export const TourCard = ({
  content,
  isAboveFold = false,
}: TourCardProps) => {
  const address = content.address?.primary ?? "주소 정보 없음";
  const regionLabel = content.region
    ? REGION_LABELS[content.region.regionCode]
    : null;
  const categoryLabel = content.classification
    ? CATEGORY_LABELS[content.classification.depth1]
    : null;

  return (
    <article className="h-full">
      <Link
        href={`/places/${content.id}`}
        aria-label={`${content.title} 상세정보 보기`}
        className="group block h-full overflow-hidden rounded-3xl border border-line bg-white transition duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-xl hover:shadow-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-subtle">
          {content.thumbnail ? (
            <Image
              src={content.thumbnail.url}
              alt=""
              fill
              loading={isAboveFold ? "eager" : "lazy"}
              sizes="(min-width: 1280px) 280px, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-sm font-medium text-slate-600"
            >
              이미지 없음
            </div>
          )}

          {regionLabel ? (
            <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-800 shadow-sm backdrop-blur">
              {regionLabel}
            </span>
          ) : null}
        </div>

        <div className="p-5 sm:p-6">
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
    </article>
  );
};

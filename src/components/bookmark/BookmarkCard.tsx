"use client";

import Image from "next/image";
import Link from "next/link";

import type { Bookmark } from "@/types/tour";
import { Icon } from "@/components/ui/Icon";

interface BookmarkCardProps {
  bookmark: Bookmark;
  onRemove: (contentId: string) => void;
}

export const BookmarkCard = ({ bookmark, onRemove }: BookmarkCardProps) => {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-sm transition hover:border-brand/30 hover:shadow-xl hover:shadow-slate-200/70">
      <Link
        href={`/places/${bookmark.contentId}`}
        aria-label={`${bookmark.title} 상세 정보 보기`}
        className="group block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-sky-200"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-subtle">
          {bookmark.thumbnailUrl ? (
            <Image
              src={bookmark.thumbnailUrl}
              alt=""
              fill
              sizes="(min-width: 1280px) 380px, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            // 변경: 저장 당시 이미지가 없었던 콘텐츠 fallback
            <div
              aria-hidden="true"
              className="flex h-full items-center justify-center text-sm text-slate-600"
            >
              이미지 없음
            </div>
          )}
        </div>

        <div className="px-5 pt-5">
          <h2 className="line-clamp-2 text-lg font-semibold leading-7 text-slate-950 transition group-hover:text-brand-strong group-hover:underline group-hover:decoration-sky-300 group-hover:underline-offset-4">
            {bookmark.title}
          </h2>

          <p className="mt-2 line-clamp-2 min-h-12 text-base leading-6 text-slate-500">
            {bookmark.address ?? "주소 정보 없음"}
          </p>
        </div>
      </Link>

      {/* 변경: 카드 전체 Link와 삭제 button을 중첩하지 않고 별도 action으로 분리 */}
      <div className="mt-auto p-5 pt-4">
        <button
          type="button"
          onClick={() => onRemove(bookmark.contentId)}
          aria-label={`${bookmark.title} 저장 취소`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-700 transition-colors hover:border-brand/30 hover:bg-brand-soft hover:text-brand-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
        >
          <Icon name="bookmark" size={17} /> 관심 여행지에서 삭제
        </button>
      </div>
    </article>
  );
};

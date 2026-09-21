"use client";

import Image from "next/image";
import Link from "next/link";

import type { Bookmark } from "@/types/tour";

interface BookmarkCardProps {
  bookmark: Bookmark;
  onRemove: (contentId: string) => void;
}

export const BookmarkCard = ({
  bookmark,
  onRemove,
}: BookmarkCardProps) => {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <Link
        href={`/places/${bookmark.contentId}`}
        aria-label={`${bookmark.title} 상세정보 보기`}
        className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-950"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {bookmark.thumbnailUrl ? (
            <Image
              src={bookmark.thumbnailUrl}
              alt=""
              fill
              sizes="(min-width: 1280px) 380px, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            // 변경: 저장 당시 이미지가 없었던 콘텐츠 fallback
            <div
              aria-hidden="true"
              className="flex h-full items-center justify-center text-sm text-slate-400"
            >
              이미지 없음
            </div>
          )}
        </div>

        <div className="px-4 pt-4">
          <h2 className="line-clamp-2 text-base font-semibold leading-6 text-slate-950">
            {bookmark.title}
          </h2>

          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
            {bookmark.address ?? "주소 정보 없음"}
          </p>
        </div>
      </Link>

      {/* 변경: 카드 전체 Link와 삭제 button을 중첩하지 않고 별도 action으로 분리 */}
      <div className="mt-auto p-4 pt-3">
        <button
          type="button"
          onClick={() =>
            onRemove(bookmark.contentId)
          }
          aria-label={`${bookmark.title} 저장 취소`}
          className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
        >
          저장 취소
        </button>
      </div>
    </article>
  );
};
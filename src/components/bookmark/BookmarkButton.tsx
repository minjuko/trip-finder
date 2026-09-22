"use client";

import { useState, useSyncExternalStore } from "react";

import { Icon } from "@/components/ui/Icon";

import {
  addBookmark,
  BOOKMARKS_CHANGE_EVENT,
  isBookmarked,
  readBookmarks,
  removeBookmark,
  writeBookmarks,
} from "@/lib/bookmarks/storage";
import type {
  Bookmark,
  TourContent,
  TourContentDetail,
} from "@/types/tour";

interface BookmarkButtonProps {
  content: TourContent | TourContentDetail;
  compact?: boolean;
}

const subscribeToBookmarks = (
  onChange: () => void,
) => {
  window.addEventListener(
    "storage",
    onChange,
  );
  window.addEventListener(
    BOOKMARKS_CHANGE_EVENT,
    onChange,
  );

  return () => {
    window.removeEventListener(
      "storage",
      onChange,
    );
    window.removeEventListener(
      BOOKMARKS_CHANGE_EVENT,
      onChange,
    );
  };
};

const getClientInitializedSnapshot = () =>
  true;

const getServerInitializedSnapshot = () =>
  false;

const createBookmark = (
  content: TourContent | TourContentDetail,
): Bookmark => ({
  contentId: content.id,
  contentTypeId:
    content.contentTypeId,
  title: content.title,

  // 상세 주소를 Bookmark 표시용 단일 문자열로 정규화
  address: content.address
    ? [
        content.address.primary,
        content.address.detail,
      ]
        .filter(Boolean)
        .join(" ")
    : null,

  thumbnailUrl:
    content.thumbnail?.url ?? null,

  savedAt: new Date().toISOString(),
});

export const BookmarkButton = ({
  content,
  compact = false,
}: BookmarkButtonProps) => {
  const [feedback, setFeedback] = useState<string | null>(null);
  // Server render와 첫 Client render를 동일하게 유지
  const initialized =
    useSyncExternalStore(
      subscribeToBookmarks,
      getClientInitializedSnapshot,
      getServerInitializedSnapshot,
    );

  const bookmarked =
    useSyncExternalStore(
      subscribeToBookmarks,
      () =>
        isBookmarked(
          readBookmarks(),
          content.id,
        ),
      () => false,
    );

  const handleClick = () => {
    const bookmarks = readBookmarks();

    if (
      isBookmarked(
        bookmarks,
        content.id,
      )
    ) {
      const nextBookmarks =
        removeBookmark(
          bookmarks,
          content.id,
        );

      writeBookmarks(nextBookmarks);

      window.dispatchEvent(
        new Event(
          BOOKMARKS_CHANGE_EVENT,
        ),
      );

      setFeedback("저장을 취소했어요");
      window.setTimeout(() => setFeedback(null), 2200);

      return;
    }

    const nextBookmarks = addBookmark(
      bookmarks,
      createBookmark(content),
    );

    writeBookmarks(nextBookmarks);

    window.dispatchEvent(
      new Event(
        BOOKMARKS_CHANGE_EVENT,
      ),
    );

    setFeedback("여행지를 저장했어요");
    window.setTimeout(() => setFeedback(null), 2200);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={!initialized}
        aria-pressed={bookmarked}
        aria-label={
          bookmarked
            ? `${content.title} 저장 취소`
            : `${content.title} 저장`
        }
        className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-brand text-sm font-semibold text-white transition hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${compact ? "px-3 py-2" : "w-fit px-4 py-2.5"}`}
      >
        <Icon name="bookmark" size={compact ? 15 : 17} className={compact ? "mr-1.5" : "mr-2"} fill={bookmarked ? "currentColor" : "none"} />
        {compact ? (bookmarked ? "저장됨" : "저장") : bookmarked ? "저장됨" : "저장"}
      </button>
      {feedback ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-xl shadow-slate-950/20"
        >
          {feedback}
        </div>
      ) : null}
    </>
  );
};

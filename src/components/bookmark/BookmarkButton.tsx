"use client";

import { useSyncExternalStore } from "react";

import {
  addBookmark,
  isBookmarked,
  readBookmarks,
  removeBookmark,
  writeBookmarks,
} from "@/lib/bookmarks/storage";
import type { Bookmark, TourContentDetail } from "@/types/tour";

interface BookmarkButtonProps {
  content: TourContentDetail;
}

const BOOKMARKS_CHANGE_EVENT = "bookmarkschange";

const subscribeToBookmarks = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  window.addEventListener(BOOKMARKS_CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(BOOKMARKS_CHANGE_EVENT, onChange);
  };
};

const getClientInitializedSnapshot = () => true;
const getServerInitializedSnapshot = () => false;

const createBookmark = (content: TourContentDetail): Bookmark => ({
  contentId: content.id,
  contentTypeId: content.contentTypeId,
  title: content.title,

  // 변경: 상세 주소를 Bookmark 표시용 단일 문자열로 정규화
  address: content.address
    ? [content.address.primary, content.address.detail]
        .filter(Boolean)
        .join(" ")
    : null,

  thumbnailUrl: content.thumbnail?.url ?? null,

  savedAt: new Date().toISOString(),
});

export const BookmarkButton = ({ content }: BookmarkButtonProps) => {
  // 변경: Server render와 첫 Client render를 동일하게 유지
  const initialized = useSyncExternalStore(
    subscribeToBookmarks,
    getClientInitializedSnapshot,
    getServerInitializedSnapshot,
  );
  const bookmarked = useSyncExternalStore(
    subscribeToBookmarks,
    () => isBookmarked(readBookmarks(), content.id),
    () => false,
  );

  const handleClick = () => {
    const bookmarks = readBookmarks();

    if (isBookmarked(bookmarks, content.id)) {
      const nextBookmarks = removeBookmark(bookmarks, content.id);

      writeBookmarks(nextBookmarks);
      window.dispatchEvent(new Event(BOOKMARKS_CHANGE_EVENT));

      return;
    }

    const nextBookmarks = addBookmark(bookmarks, createBookmark(content));

    writeBookmarks(nextBookmarks);
    window.dispatchEvent(new Event(BOOKMARKS_CHANGE_EVENT));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!initialized}
      aria-pressed={bookmarked}
      aria-label={
        bookmarked ? `${content.title} 저장 취소` : `${content.title} 저장`
      }
      className="inline-flex w-fit shrink-0 items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span aria-hidden="true" className="mr-2">
        {bookmarked ? "★" : "☆"}
      </span>

      {bookmarked ? "저장됨" : "저장"}
    </button>
  );
};

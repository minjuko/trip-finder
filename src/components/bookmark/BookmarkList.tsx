"use client";

import {
  useCallback,
  useSyncExternalStore,
} from "react";
import Link from "next/link";

import {
  readBookmarks,
  removeBookmark,
  writeBookmarks,
} from "@/lib/bookmarks/storage";
import type { Bookmark } from "@/types/tour";

import { BookmarkCard } from "./BookmarkCard";

const BOOKMARKS_CHANGE_EVENT =
  "bookmarkschange";

// 변경: BookmarkButton과 동일한 storage/custom event 계약 사용
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

// 변경: localStorage 문자열을 snapshot으로 사용.
// 같은 저장 상태에서는 동일 primitive 값이므로
// useSyncExternalStore snapshot 안정성을 유지
const getBookmarksSnapshot = () =>
  window.localStorage.getItem(
    "trip-finder:bookmarks",
  ) ?? "";

const getServerBookmarksSnapshot = () =>
  "";

export const BookmarkList = () => {
  const storedValue =
    useSyncExternalStore(
      subscribeToBookmarks,
      getBookmarksSnapshot,
      getServerBookmarksSnapshot,
    );

  // 변경: storage의 Zod validation 경계를 그대로 재사용
  const bookmarks: Bookmark[] =
    storedValue === ""
      ? []
      : readBookmarks();

  const handleRemove = useCallback(
    (contentId: string) => {
      const currentBookmarks =
        readBookmarks();

      const nextBookmarks =
        removeBookmark(
          currentBookmarks,
          contentId,
        );

      writeBookmarks(nextBookmarks);

      // 변경: 같은 document에서는 native storage event가 발생하지 않으므로
      // custom event로 즉시 UI 동기화
      window.dispatchEvent(
        new Event(
          BOOKMARKS_CHANGE_EVENT,
        ),
      );
    },
    [],
  );

  if (bookmarks.length === 0) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
        <div>
          <p className="text-lg font-semibold text-slate-900">
            저장한 여행지가 없습니다.
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            관심 있는 여행지를 저장하면
            이곳에서 다시 확인할 수 있습니다.
          </p>

          <Link
            href="/explore"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
          >
            여행지 탐색하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    // 변경: Explore와 동일한 Desktop-first 카드 밀도 유지
    <ul className="grid grid-cols-1 gap-x-5 gap-y-7 md:grid-cols-2 xl:grid-cols-3">
      {bookmarks.map((bookmark) => (
        <li key={bookmark.contentId}>
          <BookmarkCard
            bookmark={bookmark}
            onRemove={handleRemove}
          />
        </li>
      ))}
    </ul>
  );
};
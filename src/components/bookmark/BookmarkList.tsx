"use client";

import Link from "next/link";
import {
  useCallback,
  useSyncExternalStore,
} from "react";

import {
  BOOKMARKS_CHANGE_EVENT,
  BOOKMARKS_STORAGE_KEY,
  readBookmarks,
  removeBookmark,
  writeBookmarks,
} from "@/lib/bookmarks/storage";
import type { Bookmark } from "@/types/tour";

import { BookmarkCard } from "./BookmarkCard";

// BookmarkButton과 동일한 storage/custom event 계약 사용
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

// 변경: storage key도 bookmarks storage module의 단일 계약 사용
const getBookmarksSnapshot = () =>
  window.localStorage.getItem(
    BOOKMARKS_STORAGE_KEY,
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
            이곳에서 다시 확인할 수
            있습니다.
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
    <ul className="grid grid-cols-1 gap-x-5 gap-y-7 md:grid-cols-2 xl:grid-cols-3">
      {bookmarks.map(
        (bookmark) => (
          <li
            key={
              bookmark.contentId
            }
          >
            <BookmarkCard
              bookmark={bookmark}
              onRemove={
                handleRemove
              }
            />
          </li>
        ),
      )}
    </ul>
  );
};
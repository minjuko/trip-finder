"use client";

import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";

import {
  BOOKMARKS_CHANGE_EVENT,
  BOOKMARKS_STORAGE_KEY,
  readBookmarks,
  removeBookmark,
  writeBookmarks,
} from "@/lib/bookmarks/storage";
import type { Bookmark } from "@/types/tour";
import { Icon } from "@/components/ui/Icon";

import { BookmarkCard } from "./BookmarkCard";

// BookmarkButton과 동일한 storage/custom event 계약 사용
const subscribeToBookmarks = (onChange: () => void) => {
  window.addEventListener("storage", onChange);

  window.addEventListener(BOOKMARKS_CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onChange);

    window.removeEventListener(BOOKMARKS_CHANGE_EVENT, onChange);
  };
};

// 변경: storage key도 bookmarks storage module의 단일 계약 사용
const getBookmarksSnapshot = () =>
  window.localStorage.getItem(BOOKMARKS_STORAGE_KEY) ?? "";

const getServerBookmarksSnapshot = () => "";

export const BookmarkList = () => {
  const storedValue = useSyncExternalStore(
    subscribeToBookmarks,
    getBookmarksSnapshot,
    getServerBookmarksSnapshot,
  );

  const bookmarks: Bookmark[] = storedValue === "" ? [] : readBookmarks();

  const handleRemove = useCallback((contentId: string) => {
    const currentBookmarks = readBookmarks();

    const nextBookmarks = removeBookmark(currentBookmarks, contentId);

    writeBookmarks(nextBookmarks);

    window.dispatchEvent(new Event(BOOKMARKS_CHANGE_EVENT));
  }, []);

  if (bookmarks.length === 0) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-line bg-surface-subtle px-6 text-center">
        <div>
          <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand">
            <Icon name="bookmark" size={26} />
          </span>
          <p className="text-xl font-semibold text-slate-900">
            관심 여행지가 없습니다.
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            관심 있는 여행지를 저장하면 여기에서 다시 확인할 수 있습니다.
          </p>

          <Link
            href="/explore"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-base font-semibold text-white transition hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            여행지 탐색하기 <Icon name="arrow-right" size={18} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-sm shadow-slate-200/30">
        <p
          className="inline-flex items-center gap-2 text-base font-semibold text-slate-700"
          aria-live="polite"
        >
          <Icon name="bookmark" size={18} className="text-brand" /> 관심 여행지{" "}
          <span className="text-brand">{bookmarks.length}</span>곳
        </p>
        <Link
          href="/explore"
          className="text-sm font-semibold text-brand transition hover:text-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          여행지 더 보기 →
        </Link>
      </div>

      <ul className="grid grid-cols-1 gap-x-5 gap-y-7 md:grid-cols-2 xl:grid-cols-3">
        {bookmarks.map((bookmark) => (
          <li key={bookmark.contentId}>
            <BookmarkCard bookmark={bookmark} onRemove={handleRemove} />
          </li>
        ))}
      </ul>
    </>
  );
};

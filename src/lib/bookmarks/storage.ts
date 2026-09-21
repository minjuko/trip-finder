import type { Bookmark } from "@/types/tour";

import { bookmarksSchema } from "./schema";

export const BOOKMARKS_STORAGE_KEY =
  "trip-finder:bookmarks";

export const parseBookmarks = (
  value: string | null,
): Bookmark[] => {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown =
      JSON.parse(value);

    // 변경: JSON 문법뿐 아니라 Bookmark 배열의 runtime 구조까지 검증
    const result =
      bookmarksSchema.safeParse(parsed);

    if (!result.success) {
      return [];
    }

    return result.data;
  } catch {
    // 변경: 깨진 JSON이 localStorage에 있어도 앱 전체가 중단되지 않도록 복구
    return [];
  }
};

export const readBookmarks = (): Bookmark[] => {
  if (typeof window === "undefined") {
    return [];
  }

  return parseBookmarks(
    window.localStorage.getItem(
      BOOKMARKS_STORAGE_KEY,
    ),
  );
};

export const writeBookmarks = (
  bookmarks: Bookmark[],
): void => {
  if (typeof window === "undefined") {
    return;
  }

  // 변경: 저장 직전에도 Domain 구조를 검증하여
  // 잘못된 값을 persistent storage에 기록하지 않음
  const validated =
    bookmarksSchema.parse(bookmarks);

  window.localStorage.setItem(
    BOOKMARKS_STORAGE_KEY,
    JSON.stringify(validated),
  );
};

export const isBookmarked = (
  bookmarks: Bookmark[],
  contentId: string,
): boolean =>
  bookmarks.some(
    (bookmark) =>
      bookmark.contentId === contentId,
  );

export const addBookmark = (
  bookmarks: Bookmark[],
  bookmark: Bookmark,
): Bookmark[] => {
  // 변경: 동일 콘텐츠 중복 저장 방지
  if (
    isBookmarked(
      bookmarks,
      bookmark.contentId,
    )
  ) {
    return bookmarks;
  }

  return [bookmark, ...bookmarks];
};

export const removeBookmark = (
  bookmarks: Bookmark[],
  contentId: string,
): Bookmark[] =>
  bookmarks.filter(
    (bookmark) =>
      bookmark.contentId !== contentId,
  );
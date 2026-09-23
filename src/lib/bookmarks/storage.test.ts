import { beforeEach, describe, expect, it } from "vitest";

import type { Bookmark } from "@/types/tour";

import {
  addBookmark,
  BOOKMARKS_STORAGE_KEY,
  isBookmarked,
  parseBookmarks,
  readBookmarks,
  removeBookmark,
  writeBookmarks,
} from "./storage";

const bookmarkFixture: Bookmark = {
  contentId: "127480",
  contentTypeId: "12",
  title: "가거도",
  address: "전남광주통합특별시 신안군 흑산면 가거도길 38-2",
  thumbnailUrl:
    "http://tong.visitkorea.or.kr/cms/resource/28/3572128_image2_1.jpg",
  savedAt: "2026-09-21T10:00:00.000Z",
};

describe("bookmark storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe("parseBookmarks", () => {
    it("returns bookmarks from valid stored JSON", () => {
      const storedValue = JSON.stringify([bookmarkFixture]);

      expect(parseBookmarks(storedValue)).toEqual([bookmarkFixture]);
    });

    // 변경: JSON 자체가 깨진 경우 안전하게 빈 배열로 복구
    it("returns an empty array for invalid JSON", () => {
      expect(parseBookmarks("{invalid-json")).toEqual([]);
    });

    // 변경: JSON 문법이 유효해도 Bookmark 계약이 아니면 폐기
    it("returns an empty array for an invalid bookmark shape", () => {
      const storedValue = JSON.stringify([
        {
          contentId: "127480",
          title: "가거도",
        },
      ]);

      expect(parseBookmarks(storedValue)).toEqual([]);
    });

    it("returns an empty array when storage is empty", () => {
      expect(parseBookmarks(null)).toEqual([]);
    });
  });

  describe("readBookmarks", () => {
    it("reads and validates bookmarks from localStorage", () => {
      window.localStorage.setItem(
        BOOKMARKS_STORAGE_KEY,
        JSON.stringify([bookmarkFixture]),
      );

      expect(readBookmarks()).toEqual([bookmarkFixture]);
    });

    it("returns an empty array when stored data is corrupted", () => {
      window.localStorage.setItem(
        BOOKMARKS_STORAGE_KEY,
        JSON.stringify({
          contentId: "127480",
        }),
      );

      expect(readBookmarks()).toEqual([]);
    });
  });

  describe("writeBookmarks", () => {
    it("writes validated bookmarks to localStorage", () => {
      writeBookmarks([bookmarkFixture]);

      expect(window.localStorage.getItem(BOOKMARKS_STORAGE_KEY)).toBe(
        JSON.stringify([bookmarkFixture]),
      );
    });
  });

  describe("bookmark collection operations", () => {
    it("adds a bookmark to the beginning of the collection", () => {
      const anotherBookmark: Bookmark = {
        ...bookmarkFixture,
        contentId: "2750143",
        contentTypeId: "14",
        title: "가가책방",
      };

      expect(addBookmark([bookmarkFixture], anotherBookmark)).toEqual([
        anotherBookmark,
        bookmarkFixture,
      ]);
    });

    // 변경: contentId를 Bookmark identity로 사용해 중복 저장 방지
    it("does not add a duplicate bookmark", () => {
      const result = addBookmark([bookmarkFixture], {
        ...bookmarkFixture,
        title: "변경된 제목",
      });

      expect(result).toEqual([bookmarkFixture]);
    });

    it("removes a bookmark by contentId", () => {
      expect(removeBookmark([bookmarkFixture], "127480")).toEqual([]);
    });

    it("checks whether a content is bookmarked", () => {
      expect(isBookmarked([bookmarkFixture], "127480")).toBe(true);

      expect(isBookmarked([bookmarkFixture], "2750143")).toBe(false);
    });
  });
});

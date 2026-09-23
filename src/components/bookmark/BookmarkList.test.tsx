import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { BOOKMARKS_STORAGE_KEY, readBookmarks } from "@/lib/bookmarks/storage";
import type { Bookmark } from "@/types/tour";

import { BookmarkList } from "./BookmarkList";

const bookmarkFixture: Bookmark = {
  contentId: "127480",
  contentTypeId: "12",
  title: "가거도",
  address: "전남광주통합특별시 신안군 흑산면 가거도길 38-2",
  thumbnailUrl:
    "http://tong.visitkorea.or.kr/cms/resource/28/3572128_image2_1.jpg",
  savedAt: "2026-09-21T10:00:00.000Z",
};

const bookmarkWithoutImageFixture: Bookmark = {
  contentId: "2805408",
  contentTypeId: "39",
  title: "가가와",
  address: null,
  thumbnailUrl: null,
  savedAt: "2026-09-21T11:00:00.000Z",
};

describe("BookmarkList", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  // 변경: 저장 데이터가 없을 때 empty state와 탐색 동선 검증
  it("renders an empty state when there are no bookmarks", () => {
    render(<BookmarkList />);

    expect(screen.getByText("관심 여행지가 없습니다.")).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "여행지 탐색하기",
      }),
    ).toHaveAttribute("href", "/explore");
  });

  // 변경: localStorage의 Bookmark 데이터를 카드로 복원
  it("renders stored bookmarks", () => {
    window.localStorage.setItem(
      BOOKMARKS_STORAGE_KEY,
      JSON.stringify([bookmarkFixture]),
    );

    render(<BookmarkList />);

    expect(
      screen.getByRole("heading", {
        name: "가거도",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText(bookmarkFixture.address!)).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "가거도 상세 정보 보기",
      }),
    ).toHaveAttribute("href", "/places/127480");
  });

  // 변경: 저장 취소 시 persistent data와 화면을 함께 갱신
  it("removes a bookmark and renders the empty state immediately", () => {
    window.localStorage.setItem(
      BOOKMARKS_STORAGE_KEY,
      JSON.stringify([bookmarkFixture]),
    );

    render(<BookmarkList />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "가거도 저장 취소",
      }),
    );

    expect(readBookmarks()).toEqual([]);

    expect(screen.getByText("관심 여행지가 없습니다.")).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        name: "가거도",
      }),
    ).not.toBeInTheDocument();
  });

  // 변경: 하나를 삭제해도 나머지 Bookmark는 유지
  it("removes only the selected bookmark", () => {
    window.localStorage.setItem(
      BOOKMARKS_STORAGE_KEY,
      JSON.stringify([bookmarkFixture, bookmarkWithoutImageFixture]),
    );

    render(<BookmarkList />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "가거도 저장 취소",
      }),
    );

    expect(readBookmarks()).toEqual([bookmarkWithoutImageFixture]);

    expect(
      screen.queryByRole("heading", {
        name: "가거도",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "가가와",
      }),
    ).toBeInTheDocument();
  });

  // 변경: 이미지와 주소가 없는 Bookmark의 fallback UI 검증
  it("renders fallback content when image and address are missing", () => {
    window.localStorage.setItem(
      BOOKMARKS_STORAGE_KEY,
      JSON.stringify([bookmarkWithoutImageFixture]),
    );

    render(<BookmarkList />);

    expect(screen.getByText("이미지 없음")).toBeInTheDocument();

    expect(screen.getByText("주소 정보 없음")).toBeInTheDocument();
  });

  // 변경: 손상된 localStorage 데이터는 empty state로 안전하게 처리
  it("renders the empty state for corrupted stored data", () => {
    window.localStorage.setItem(BOOKMARKS_STORAGE_KEY, "{invalid-json");

    render(<BookmarkList />);

    expect(screen.getByText("관심 여행지가 없습니다.")).toBeInTheDocument();
  });
});

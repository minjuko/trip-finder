import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import {
  BOOKMARKS_STORAGE_KEY,
  readBookmarks,
} from "@/lib/bookmarks/storage";
import type { TourContentDetail } from "@/types/tour";

import { BookmarkButton } from "./BookmarkButton";

const contentFixture: TourContentDetail = {
  id: "127480",
  contentTypeId: "12",
  title: "가거도",

  address: {
    primary:
      "전남광주통합특별시 신안군 흑산면 가거도길 38-2",
    detail: null,
    zipCode: "58866",
  },

  thumbnail: {
    url: "http://tong.visitkorea.or.kr/cms/resource/28/3572128_image2_1.jpg",
    copyrightType: "Type1",
  },

  region: {
    regionCode: "12",
    districtCode: "870",
  },

  classification: {
    depth1: "NA",
    depth2: "NA02",
    depth3: "NA020500",
  },

  coordinates: {
    latitude: 34.0520609879,
    longitude: 125.1263860145,
  },

  homepage:
    "https://tour.shinan.go.kr/home/tour/island_tour/heuksan/place/place_12/page.wscms",

  phone: null,

  overview: "가거도 상세 설명",

  images: [],
  information: [],
  repeatingInformation: [],
};

describe("BookmarkButton", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  // 변경: localStorage가 비어 있을 때 초기 UI 계약 검증
  it("renders an unbookmarked state initially", async () => {
    render(
      <BookmarkButton
        content={contentFixture}
      />,
    );

    const button =
      await screen.findByRole(
        "button",
        {
          name: "가거도 저장",
        },
      );

    expect(button).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    expect(button).toHaveTextContent(
      "저장",
    );
  });

  // 변경: 사용자 클릭 → localStorage 저장 → UI 상태 변경 전체 흐름 검증
  it("saves a bookmark when clicked", async () => {
    render(
      <BookmarkButton
        content={contentFixture}
      />,
    );

    const button =
      await screen.findByRole(
        "button",
        {
          name: "가거도 저장",
        },
      );

    await waitFor(() => {
      expect(button).toBeEnabled();
    });

    fireEvent.click(button);

    expect(
      await screen.findByRole(
        "button",
        {
          name: "가거도 저장 취소",
        },
      ),
    ).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    const bookmarks =
      readBookmarks();

    expect(bookmarks).toHaveLength(1);

    expect(bookmarks[0]).toMatchObject({
      contentId: "127480",
      contentTypeId: "12",
      title: "가거도",
      address:
        "전남광주통합특별시 신안군 흑산면 가거도길 38-2",
      thumbnailUrl:
        "http://tong.visitkorea.or.kr/cms/resource/28/3572128_image2_1.jpg",
    });

    // 변경: 실제 저장 시 ISO 형식의 savedAt 생성 여부 검증
    expect(
      Number.isNaN(
        Date.parse(
          bookmarks[0].savedAt,
        ),
      ),
    ).toBe(false);
  });

  // 변경: 기존 localStorage 상태를 mount 이후 UI에 복원
  it("restores an existing bookmark from localStorage", async () => {
    window.localStorage.setItem(
      BOOKMARKS_STORAGE_KEY,
      JSON.stringify([
        {
          contentId: "127480",
          contentTypeId: "12",
          title: "가거도",
          address:
            "전남광주통합특별시 신안군 흑산면 가거도길 38-2",
          thumbnailUrl:
            "http://tong.visitkorea.or.kr/cms/resource/28/3572128_image2_1.jpg",
          savedAt:
            "2026-09-21T10:00:00.000Z",
        },
      ]),
    );

    render(
      <BookmarkButton
        content={contentFixture}
      />,
    );

    const button =
      await screen.findByRole(
        "button",
        {
          name: "가거도 저장 취소",
        },
      );

    expect(button).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    expect(button).toHaveTextContent(
      "저장됨",
    );
  });

  // 변경: 저장된 콘텐츠를 다시 누르면 localStorage와 UI에서 제거
  it("removes an existing bookmark when clicked", async () => {
    window.localStorage.setItem(
      BOOKMARKS_STORAGE_KEY,
      JSON.stringify([
        {
          contentId: "127480",
          contentTypeId: "12",
          title: "가거도",
          address:
            "전남광주통합특별시 신안군 흑산면 가거도길 38-2",
          thumbnailUrl:
            "http://tong.visitkorea.or.kr/cms/resource/28/3572128_image2_1.jpg",
          savedAt:
            "2026-09-21T10:00:00.000Z",
        },
      ]),
    );

    render(
      <BookmarkButton
        content={contentFixture}
      />,
    );

    const button =
      await screen.findByRole(
        "button",
        {
          name: "가거도 저장 취소",
        },
      );

    fireEvent.click(button);

    expect(
      await screen.findByRole(
        "button",
        {
          name: "가거도 저장",
        },
      ),
    ).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    expect(
      readBookmarks(),
    ).toEqual([]);
  });

  // 변경: 손상된 persistent data가 있어도 정상적으로 새 Bookmark 저장
  it("recovers from corrupted localStorage data", async () => {
    window.localStorage.setItem(
      BOOKMARKS_STORAGE_KEY,
      "{invalid-json",
    );

    render(
      <BookmarkButton
        content={contentFixture}
      />,
    );

    const button =
      await screen.findByRole(
        "button",
        {
          name: "가거도 저장",
        },
      );

    await waitFor(() => {
      expect(button).toBeEnabled();
    });

    fireEvent.click(button);

    expect(
      readBookmarks(),
    ).toHaveLength(1);
  });
});

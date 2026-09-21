import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import { HomeSearch } from "./HomeSearch";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("HomeSearch", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  // 변경: 입력값을 keyword Search Param으로 전달
  it("navigates to Explore with a keyword", () => {
    render(<HomeSearch />);

    fireEvent.change(
      screen.getByRole("searchbox", {
        name: "여행지 검색",
      }),
      {
        target: {
          value: "해수욕장",
        },
      },
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "검색",
      }),
    );

    expect(pushMock).toHaveBeenCalledWith(
      "/explore?keyword=%ED%95%B4%EC%88%98%EC%9A%95%EC%9E%A5",
    );
  });

  // 변경: 검색어 앞뒤 공백 제거
  it("trims the keyword before navigating", () => {
    render(<HomeSearch />);

    fireEvent.change(
      screen.getByRole("searchbox", {
        name: "여행지 검색",
      }),
      {
        target: {
          value: "  제주도  ",
        },
      },
    );

    fireEvent.submit(
      screen.getByRole("search", {
        name: "여행지 검색",
      }),
    );

    expect(pushMock).toHaveBeenCalledWith(
      "/explore?keyword=%EC%A0%9C%EC%A3%BC%EB%8F%84",
    );
  });

  // 변경: 유효한 검색어가 없으면 필터 없는 Explore로 이동
  it("navigates to Explore without a keyword when the input is empty", () => {
    render(<HomeSearch />);

    fireEvent.change(
      screen.getByRole("searchbox", {
        name: "여행지 검색",
      }),
      {
        target: {
          value: "   ",
        },
      },
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "검색",
      }),
    );

    expect(pushMock).toHaveBeenCalledWith(
      "/explore",
    );
  });
});
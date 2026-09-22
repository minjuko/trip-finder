import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExploreSearch } from "./ExploreSearch";

const push = vi.fn();

// 변경: Client Component에서 사용하는 Next.js router mock
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

describe("ExploreSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    window.history.replaceState({}, "", "/explore");
  });

  it("renders the initial keyword", () => {
    render(<ExploreSearch initialKeyword="경복궁" />);

    expect(screen.getByRole("searchbox")).toHaveValue("경복궁");
  });

  it("updates the keyword in the URL", () => {
    render(<ExploreSearch initialKeyword={null} />);

    fireEvent.change(screen.getByRole("searchbox"), {
      target: {
        value: " 해수욕장 ",
      },
    });

    fireEvent.submit(screen.getByRole("search"));

    expect(push).toHaveBeenCalledWith(
      "/explore?keyword=%ED%95%B4%EC%88%98%EC%9A%95%EC%9E%A5",
      { scroll: false },
    );
  });

  // 변경: 검색해도 기존 필터가 사라지지 않는지 검증
  it("preserves existing filter parameters", () => {
    window.history.replaceState(
      {},
      "",
      "/explore?region=11&district=110&category1=NA&category2=NA02",
    );

    render(<ExploreSearch initialKeyword={null} />);

    fireEvent.change(screen.getByRole("searchbox"), {
      target: {
        value: "한강",
      },
    });

    fireEvent.submit(screen.getByRole("search"));

    expect(push).toHaveBeenCalledOnce();

    const destination = push.mock.calls[0][0] as string;

    const url = new URL(destination, "http://localhost");

    expect(url.pathname).toBe("/explore");
    expect(url.searchParams.get("region")).toBe("11");
    expect(url.searchParams.get("district")).toBe("110");
    expect(url.searchParams.get("category1")).toBe("NA");
    expect(url.searchParams.get("category2")).toBe("NA02");
    expect(url.searchParams.get("keyword")).toBe("한강");
  });

  // 변경: 새로운 검색은 기존 pagination을 초기화
  it("removes the page parameter when searching", () => {
    window.history.replaceState({}, "", "/explore?region=11&page=4");

    render(<ExploreSearch initialKeyword={null} />);

    fireEvent.change(screen.getByRole("searchbox"), {
      target: {
        value: "경복궁",
      },
    });

    fireEvent.submit(screen.getByRole("search"));

    const destination = push.mock.calls[0][0] as string;

    const url = new URL(destination, "http://localhost");

    expect(url.searchParams.get("keyword")).toBe("경복궁");

    expect(url.searchParams.has("page")).toBe(false);
  });

  // 변경: 검색어를 지우고 검색하면 keyword 자체를 URL에서 제거
  it("removes the keyword when the input is empty", () => {
    window.history.replaceState(
      {},
      "",
      "/explore?keyword=%EA%B2%BD%EB%B3%B5%EA%B6%81&region=11&page=3",
    );

    render(<ExploreSearch initialKeyword="경복궁" />);

    fireEvent.change(screen.getByRole("searchbox"), {
      target: {
        value: "   ",
      },
    });

    fireEvent.submit(screen.getByRole("search"));

    const destination = push.mock.calls[0][0] as string;

    const url = new URL(destination, "http://localhost");

    expect(url.searchParams.has("keyword")).toBe(false);

    expect(url.searchParams.get("region")).toBe("11");

    expect(url.searchParams.has("page")).toBe(false);
  });
});

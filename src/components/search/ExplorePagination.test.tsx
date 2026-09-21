import {
  render,
  screen,
} from "@testing-library/react";
import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  ExploreQuery,
} from "@/lib/search/explore-query";

import { ExplorePagination } from "./ExplorePagination";

const createQuery = (
  overrides: Partial<ExploreQuery> = {},
): ExploreQuery => ({
  region: null,
  district: null,
  category1: null,
  category2: null,
  category3: null,
  keyword: null,
  page: 1,
  ...overrides,
});

describe("ExplorePagination", () => {
  it("does not render when there is only one page", () => {
    render(
      <ExplorePagination
        query={createQuery()}
        totalCount={12}
        pageSize={12}
      />,
    );

    expect(
      screen.queryByRole("navigation"),
    ).not.toBeInTheDocument();
  });

  it("renders the next page link on the first page", () => {
    render(
      <ExplorePagination
        query={createQuery()}
        totalCount={30}
        pageSize={12}
      />,
    );

    expect(
      screen.getByRole("link", {
        name: "다음",
      }),
    ).toHaveAttribute(
      "href",
      "/explore?page=2",
    );

    expect(
      screen.queryByRole("link", {
        name: "이전",
      }),
    ).not.toBeInTheDocument();
  });

  // 변경: 검색/필터 조건을 pagination URL에 보존하는지 검증
  it("preserves search and filter parameters", () => {
    render(
      <ExplorePagination
        query={createQuery({
          region: "11",
          district: "110",
          category1: "NA",
          category2: "NA02",
          category3: "NA020900",
          keyword: "해수욕장",
          page: 2,
        })}
        totalCount={100}
        pageSize={12}
      />,
    );

    const nextLink = screen.getByRole(
      "link",
      {
        name: "다음",
      },
    );

    const href =
      nextLink.getAttribute("href");

    expect(href).not.toBeNull();

    const url = new URL(
      href!,
      "http://localhost",
    );

    expect(
      url.searchParams.get("region"),
    ).toBe("11");

    expect(
      url.searchParams.get("district"),
    ).toBe("110");

    expect(
      url.searchParams.get("category1"),
    ).toBe("NA");

    expect(
      url.searchParams.get("category2"),
    ).toBe("NA02");

    expect(
      url.searchParams.get("category3"),
    ).toBe("NA020900");

    expect(
      url.searchParams.get("keyword"),
    ).toBe("해수욕장");

    expect(
      url.searchParams.get("page"),
    ).toBe("3");
  });

  it("removes page when navigating back to page 1", () => {
    render(
      <ExplorePagination
        query={createQuery({
          keyword: "경복궁",
          page: 2,
        })}
        totalCount={30}
        pageSize={12}
      />,
    );

    expect(
      screen.getByRole("link", {
        name: "이전",
      }),
    ).toHaveAttribute(
      "href",
      "/explore?keyword=%EA%B2%BD%EB%B3%B5%EA%B6%81",
    );
  });

  it("does not provide a next link on the last page", () => {
    render(
      <ExplorePagination
        query={createQuery({
          page: 3,
        })}
        totalCount={30}
        pageSize={12}
      />,
    );

    expect(
      screen.queryByRole("link", {
        name: "다음",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "이전",
      }),
    ).toHaveAttribute(
      "href",
      "/explore?page=2",
    );
  });
});
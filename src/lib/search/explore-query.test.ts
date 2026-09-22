import { describe, expect, it } from "vitest";

import { parseExploreQuery } from "./explore-query";

describe("parseExploreQuery", () => {
  it("returns defaults when search params are empty", () => {
    expect(parseExploreQuery({})).toEqual({
      region: null,
      district: null,
      category1: null,
      category2: null,
      category3: null,
      keyword: null,
      page: 1,
      view: "grid",
      sort: "relevance",
    });
  });

  it("parses valid explore search params", () => {
    expect(
      parseExploreQuery({
        region: "11",
        district: "110",
        category1: "NA",
        category2: "NA02",
        category3: "NA020900",
        keyword: "한강",
        page: "3",
      }),
    ).toEqual({
      region: "11",
      district: "110",
      category1: "NA",
      category2: "NA02",
      category3: "NA020900",
      keyword: "한강",
      page: 3,
      view: "grid",
      sort: "relevance",
    });
  });

  it("trims optional string values", () => {
    expect(
      parseExploreQuery({
        region: " 11 ",
        district: " 110 ",
        category1: " NA ",
        category2: " NA02 ",
        category3: " NA020900 ",
        keyword: " 한강 ",
      }),
    ).toEqual({
      region: "11",
      district: "110",
      category1: "NA",
      category2: "NA02",
      category3: "NA020900",
      keyword: "한강",
      page: 1,
      view: "grid",
      sort: "relevance",
    });
  });

  it("converts empty string values to null", () => {
    expect(
      parseExploreQuery({
        region: "",
        district: "",
        category1: "",
        category2: "",
        category3: "",
        keyword: "   ",
      }),
    ).toEqual({
      region: null,
      district: null,
      category1: null,
      category2: null,
      category3: null,
      keyword: null,
      page: 1,
      view: "grid",
      sort: "relevance",
    });
  });

  it.each([
    ["0"],
    ["-1"],
    ["1.5"],
    ["abc"],
    ["2abc"],
    [""],
  ])(
    "falls back to page 1 for invalid page %s",
    (page) => {
      expect(parseExploreQuery({ page }).page).toBe(1);
    },
  );

  it("accepts a positive integer page", () => {
    expect(
      parseExploreQuery({
        page: "12",
      }).page,
    ).toBe(12);
  });

  it("accepts the list view and falls back to grid for invalid values", () => {
    expect(parseExploreQuery({ view: "list" }).view).toBe("list");
    expect(parseExploreQuery({ view: "table" }).view).toBe("grid");
  });

  it("accepts title sorting and falls back to relevance for invalid values", () => {
    expect(parseExploreQuery({ sort: "title" }).sort).toBe("title");
    expect(parseExploreQuery({ sort: "unknown" }).sort).toBe("relevance");
  });

  it("ignores district when region is missing", () => {
    expect(
      parseExploreQuery({
        district: "110",
      }).district,
    ).toBeNull();
  });

  // 변경: category1 없는 하위 분류는 유효하지 않음
  it("ignores lower classification levels when category1 is missing", () => {
    expect(
      parseExploreQuery({
        category2: "NA02",
        category3: "NA020900",
      }),
    ).toMatchObject({
      category1: null,
      category2: null,
      category3: null,
    });
  });

  // 변경: category2 없는 category3도 유효하지 않음
  it("ignores category3 when category2 is missing", () => {
    expect(
      parseExploreQuery({
        category1: "NA",
        category3: "NA020900",
      }),
    ).toMatchObject({
      category1: "NA",
      category2: null,
      category3: null,
    });
  });

  it("uses the first value when a parameter is repeated", () => {
    expect(
      parseExploreQuery({
        region: ["11", "26"],
        category1: ["NA", "FD"],
        keyword: ["서울", "부산"],
        page: ["2", "3"],
      }),
    ).toEqual({
      region: "11",
      district: null,
      category1: "NA",
      category2: null,
      category3: null,
      keyword: "서울",
      page: 2,
      view: "grid",
      sort: "relevance",
    });
  });

  it("falls back to page 1 when the page exceeds the safe integer range", () => {
    expect(
      parseExploreQuery({
        page: "999999999999999999999999",
      }).page,
    ).toBe(1);
  });
});

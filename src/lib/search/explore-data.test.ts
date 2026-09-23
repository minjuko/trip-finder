import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAreaBasedList } from "../tour-api/area-based-list";
import { searchKeyword } from "../tour-api/search-keyword";
import { getExploreData } from "./explore-data";
import type { ExploreQuery } from "./explore-query";

vi.mock("../tour-api/area-based-list", () => ({
  getAreaBasedList: vi.fn(),
}));

vi.mock("../tour-api/search-keyword", () => ({
  searchKeyword: vi.fn(),
}));

const mockedGetAreaBasedList = vi.mocked(getAreaBasedList);

const mockedSearchKeyword = vi.mocked(searchKeyword);

const emptyResult = {
  items: [],
  page: 1,
  pageSize: 12,
  totalCount: 0,
};

const createQuery = (overrides: Partial<ExploreQuery> = {}): ExploreQuery => ({
  region: null,
  district: null,

  // 변경: ExploreQuery의 계층형 분류 기본값
  category1: null,
  category2: null,
  category3: null,

  keyword: null,
  page: 1,
  view: "grid",
  sort: "relevance",
  ...overrides,
});

describe("getExploreData", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedGetAreaBasedList.mockResolvedValue(emptyResult);
    mockedSearchKeyword.mockResolvedValue(emptyResult);
  });

  it("uses areaBasedList2 when keyword is missing", async () => {
    await getExploreData(
      createQuery({
        region: "11",
        district: "110",
        page: 2,
      }),
    );

    expect(mockedGetAreaBasedList).toHaveBeenCalledOnce();

    expect(mockedGetAreaBasedList).toHaveBeenCalledWith({
      regionCode: "11",
      districtCode: "110",
      classificationDepth1: undefined,
      classificationDepth2: undefined,
      classificationDepth3: undefined,
      page: 2,
      pageSize: 12,
    });

    expect(mockedSearchKeyword).not.toHaveBeenCalled();
  });

  it("uses searchKeyword2 when keyword exists", async () => {
    await getExploreData(
      createQuery({
        region: "11",
        district: "110",
        keyword: "경복궁",
        page: 3,
      }),
    );

    expect(mockedSearchKeyword).toHaveBeenCalledOnce();

    expect(mockedSearchKeyword).toHaveBeenCalledWith({
      keyword: "경복궁",
      regionCode: "11",
      districtCode: "110",
      classificationDepth1: undefined,
      classificationDepth2: undefined,
      classificationDepth3: undefined,
      page: 3,
      pageSize: 12,
    });

    expect(mockedGetAreaBasedList).not.toHaveBeenCalled();
  });

  // 변경: 계층형 관광 분류가 목록 endpoint에 전달되는지 검증
  it("passes classification filters to areaBasedList2", async () => {
    await getExploreData(
      createQuery({
        category1: "NA",
        category2: "NA02",
        category3: "NA020900",
      }),
    );

    expect(mockedGetAreaBasedList).toHaveBeenCalledWith({
      regionCode: undefined,
      districtCode: undefined,
      classificationDepth1: "NA",
      classificationDepth2: "NA02",
      classificationDepth3: "NA020900",
      page: 1,
      pageSize: 12,
    });
  });

  // 변경: 검색 endpoint에도 동일한 관광 분류가 전달되는지 검증
  it("passes classification filters to searchKeyword2", async () => {
    await getExploreData(
      createQuery({
        category1: "NA",
        category2: "NA02",
        category3: "NA020900",
        keyword: "해수욕장",
      }),
    );

    expect(mockedSearchKeyword).toHaveBeenCalledWith({
      keyword: "해수욕장",
      regionCode: undefined,
      districtCode: undefined,
      classificationDepth1: "NA",
      classificationDepth2: "NA02",
      classificationDepth3: "NA020900",
      page: 1,
      pageSize: 12,
    });
  });

  it("omits optional filters when they are not selected", async () => {
    await getExploreData(
      createQuery({
        keyword: "경복궁",
      }),
    );

    expect(mockedSearchKeyword).toHaveBeenCalledWith({
      keyword: "경복궁",
      regionCode: undefined,
      districtCode: undefined,
      classificationDepth1: undefined,
      classificationDepth2: undefined,
      classificationDepth3: undefined,
      page: 1,
      pageSize: 12,
    });
  });

  it("returns the paginated result from the selected endpoint", async () => {
    const result = {
      items: [],
      page: 2,
      pageSize: 12,
      totalCount: 25,
    };

    mockedGetAreaBasedList.mockResolvedValue(result);

    await expect(
      getExploreData(
        createQuery({
          page: 2,
        }),
      ),
    ).resolves.toEqual({
      contents: result,
    });
  });
});

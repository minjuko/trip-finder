import { beforeEach, describe, expect, it, vi } from "vitest";

import { areaBasedListFixture } from "./__fixtures__/area-based-list";
import { requestTourApi } from "./client";
import { searchKeyword } from "./search-keyword";

// 변경: 실제 TourAPI 호출 없이 검색 wrapper의 요청 계약 검증
vi.mock("./client", () => ({
  requestTourApi: vi.fn(),
}));

const mockedRequestTourApi = vi.mocked(requestTourApi);

describe("searchKeyword", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedRequestTourApi.mockResolvedValue(
      structuredClone(areaBasedListFixture),
    );
  });

  it("requests searchKeyword2 with a normalized keyword", async () => {
    await searchKeyword({
      keyword: " 경복궁 ",
    });

    expect(mockedRequestTourApi).toHaveBeenCalledOnce();

    expect(mockedRequestTourApi).toHaveBeenCalledWith(
      "searchKeyword2",
      {
        params: {
          keyword: "경복궁",
          pageNo: 1,
          numOfRows: 12,
          arrange: "A",
        },
      },
    );
  });

  it("passes region and content type filters", async () => {
    await searchKeyword({
      keyword: "경복궁",
      regionCode: "11",
      districtCode: "110",
      contentTypeId: "12",
      page: 2,
      pageSize: 20,
    });

    expect(mockedRequestTourApi).toHaveBeenCalledWith(
      "searchKeyword2",
      {
        params: {
          keyword: "경복궁",
          pageNo: 2,
          numOfRows: 20,
          arrange: "A",
          lDongRegnCd: "11",
          lDongSignguCd: "110",
          contentTypeId: "12",
        },
      },
    );
  });

  // 변경: searchKeyword2에서도 검증한 신분류체계 parameter 계약 고정
  it("passes classification depth filters", async () => {
    await searchKeyword({
      keyword: "해수욕장",
      classificationDepth1: "NA",
      classificationDepth2: "NA02",
      classificationDepth3: "NA020900",
    });

    expect(mockedRequestTourApi).toHaveBeenCalledWith(
      "searchKeyword2",
      {
        params: {
          keyword: "해수욕장",
          pageNo: 1,
          numOfRows: 12,
          arrange: "A",
          lclsSystm1: "NA",
          lclsSystm2: "NA02",
          lclsSystm3: "NA020900",
        },
      },
    );
  });

  // 변경: 공백뿐인 검색어가 외부 API까지 전달되지 않는지 검증
  it("rejects an empty normalized keyword before requesting the API", async () => {
    await expect(
      searchKeyword({
        keyword: "   ",
      }),
    ).rejects.toThrow("keyword is required");

    expect(mockedRequestTourApi).not.toHaveBeenCalled();
  });
});
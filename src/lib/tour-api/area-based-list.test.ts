import { beforeEach, describe, expect, it, vi } from "vitest";

import { areaBasedListFixture } from "./__fixtures__/area-based-list";
import { getAreaBasedList } from "./area-based-list";
import { TOUR_API_CACHE } from "./cache";
import { requestTourApi } from "./client";

// 변경: 실제 TourAPI를 호출하지 않고 wrapper가 구성하는 요청을 검증
vi.mock("./client", () => ({
  requestTourApi: vi.fn(),
}));

const mockedRequestTourApi = vi.mocked(requestTourApi);

describe("getAreaBasedList", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedRequestTourApi.mockResolvedValue(
      structuredClone(areaBasedListFixture),
    );
  });

  it("requests areaBasedList2 with default pagination", async () => {
    await getAreaBasedList();

    expect(mockedRequestTourApi).toHaveBeenCalledOnce();

    expect(mockedRequestTourApi).toHaveBeenCalledWith(
      "areaBasedList2",
      {
        params: {
          pageNo: 1,
          numOfRows: 12,
          arrange: "A",
        },
        // 변경: 목록 API 캐시 정책 계약 검증
        cacheOptions: TOUR_API_CACHE.CONTENT_LIST,
      },
    );
  });

  it("passes region and content type filters", async () => {
    await getAreaBasedList({
      regionCode: "11",
      districtCode: "110",
      contentTypeId: "12",
      page: 2,
      pageSize: 20,
    });

    expect(mockedRequestTourApi).toHaveBeenCalledWith(
      "areaBasedList2",
      {
        params: {
          pageNo: 2,
          numOfRows: 20,
          arrange: "A",
          lDongRegnCd: "11",
          lDongSignguCd: "110",
          contentTypeId: "12",
        },
        cacheOptions: TOUR_API_CACHE.CONTENT_LIST,
      },
    );
  });

  // 변경: 실 API에서 검증한 신분류체계 1~3단계 parameter 계약 고정
  it("passes classification depth filters", async () => {
    await getAreaBasedList({
      classificationDepth1: "NA",
      classificationDepth2: "NA02",
      classificationDepth3: "NA020900",
    });

    expect(mockedRequestTourApi).toHaveBeenCalledWith(
      "areaBasedList2",
      {
        params: {
          pageNo: 1,
          numOfRows: 12,
          arrange: "A",
          lclsSystm1: "NA",
          lclsSystm2: "NA02",
          lclsSystm3: "NA020900",
        },
        cacheOptions: TOUR_API_CACHE.CONTENT_LIST,
      },
    );
  });
});

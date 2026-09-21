import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  cultureIntroFixture,
  emptyDetailIntroFixture,
  touristAttractionIntroFixture,
} from "./__fixtures__/detail-intro";
import { TOUR_API_CACHE } from "./cache";
import { requestTourApi } from "./client";
import { getTourDetailIntro } from "./detail-intro";

vi.mock("./client", () => ({
  requestTourApi: vi.fn(),
}));

const mockedRequestTourApi =
  vi.mocked(requestTourApi);

describe("getTourDetailIntro", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedRequestTourApi.mockResolvedValue(
      structuredClone(
        touristAttractionIntroFixture,
      ),
    );
  });

  it("requests detailIntro2 with normalized contentId and contentTypeId", async () => {
    await getTourDetailIntro({
      contentId: " 127480 ",
      contentTypeId: " 12 ",
    });

    expect(
      mockedRequestTourApi,
    ).toHaveBeenCalledOnce();

    expect(
      mockedRequestTourApi,
    ).toHaveBeenCalledWith(
      "detailIntro2",
      {
        params: {
          contentId: "127480",
          contentTypeId: "12",
        },

        // 변경: 상세 소개정보에도 상세 캐시 정책 적용
        cacheOptions:
          TOUR_API_CACHE.CONTENT_DETAIL,
      },
    );
  });

  // 변경: 실제 지원하는 다른 contentType도 동일한 API 계약 사용
  it("requests detailIntro2 for culture content", async () => {
    mockedRequestTourApi.mockResolvedValue(
      structuredClone(
        cultureIntroFixture,
      ),
    );

    await getTourDetailIntro({
      contentId: "2750143",
      contentTypeId: "14",
    });

    expect(
      mockedRequestTourApi,
    ).toHaveBeenCalledWith(
      "detailIntro2",
      {
        params: {
          contentId: "2750143",
          contentTypeId: "14",
        },
        cacheOptions:
          TOUR_API_CACHE.CONTENT_DETAIL,
      },
    );
  });

  it("returns an empty array when detailIntro2 has no item", async () => {
    mockedRequestTourApi.mockResolvedValue(
      structuredClone(
        emptyDetailIntroFixture,
      ),
    );

    await expect(
      getTourDetailIntro({
        contentId: "127480",
        contentTypeId: "12",
      }),
    ).resolves.toEqual([]);
  });

  it("rejects an empty contentId before requesting the API", async () => {
    await expect(
      getTourDetailIntro({
        contentId: "   ",
        contentTypeId: "12",
      }),
    ).rejects.toThrow(
      "contentId is required",
    );

    expect(
      mockedRequestTourApi,
    ).not.toHaveBeenCalled();
  });

  it("rejects an empty contentTypeId before requesting the API", async () => {
    await expect(
      getTourDetailIntro({
        contentId: "127480",
        contentTypeId: "   ",
      }),
    ).rejects.toThrow(
      "contentTypeId is required",
    );

    expect(
      mockedRequestTourApi,
    ).not.toHaveBeenCalled();
  });

  // 변경: 실제 계약을 검증하지 않은 contentType은 외부 API 호출 전에 차단
  it("rejects an unsupported contentTypeId before requesting the API", async () => {
    await expect(
      getTourDetailIntro({
        contentId: "127480",
        contentTypeId: "15",
      }),
    ).rejects.toThrow(
      "Unsupported contentTypeId: 15",
    );

    expect(
      mockedRequestTourApi,
    ).not.toHaveBeenCalled();
  });

  // 변경: 요청 유형과 TourAPI 응답 유형이 다른 경우 잘못된 데이터 결합 차단
  it("rejects a mismatched response contentTypeId", async () => {
    mockedRequestTourApi.mockResolvedValue(
      structuredClone(
        cultureIntroFixture,
      ),
    );

    await expect(
      getTourDetailIntro({
        contentId: "127480",
        contentTypeId: "12",
      }),
    ).rejects.toThrow(
      "TourAPI detailIntro contentTypeId mismatch",
    );
  });

  it("throws a TourApiError when TourAPI returns an error result code", async () => {
    mockedRequestTourApi.mockResolvedValue({
      response: {
        header: {
          resultCode: "10",
          resultMsg:
            "INVALID_REQUEST_PARAMETER_ERROR",
        },
        body: {
          items: "",
          numOfRows: 0,
          pageNo: 1,
          totalCount: 0,
        },
      },
    });

    await expect(
      getTourDetailIntro({
        contentId: "127480",
        contentTypeId: "12",
      }),
    ).rejects.toMatchObject({
      name: "TourApiError",
      type: "INVALID_REQUEST",
      resultCode: "10",
    });
  });
});
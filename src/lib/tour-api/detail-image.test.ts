import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  detailImageFixture,
  emptyDetailImageFixture,
} from "./__fixtures__/detail-image";
import { TOUR_API_CACHE } from "./cache";
import { requestTourApi } from "./client";
import { getTourDetailImages } from "./detail-image";

vi.mock("./client", () => ({
  requestTourApi: vi.fn(),
}));

const mockedRequestTourApi = vi.mocked(requestTourApi);

describe("getTourDetailImages", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedRequestTourApi.mockResolvedValue(structuredClone(detailImageFixture));
  });

  it("requests detailImage2 with the normalized contentId", async () => {
    await getTourDetailImages(" 127480 ");

    expect(mockedRequestTourApi).toHaveBeenCalledOnce();

    expect(mockedRequestTourApi).toHaveBeenCalledWith("detailImage2", {
      params: {
        contentId: "127480",
      },

      // 변경: 상세 이미지에도 동일한 상세 캐시 정책 적용
      cacheOptions: TOUR_API_CACHE.CONTENT_DETAIL,
    });
  });

  // 변경: 실제 음식점 응답에서 확인한 items: "" 계약 고정
  it("returns an empty array when detailImage2 has no images", async () => {
    mockedRequestTourApi.mockResolvedValue(
      structuredClone(emptyDetailImageFixture),
    );

    await expect(getTourDetailImages("2805408")).resolves.toEqual([]);
  });

  it("rejects an empty contentId before requesting the API", async () => {
    await expect(getTourDetailImages("   ")).rejects.toThrow(
      "contentId is required",
    );

    expect(mockedRequestTourApi).not.toHaveBeenCalled();
  });

  it("throws a TourApiError when TourAPI returns an error result code", async () => {
    mockedRequestTourApi.mockResolvedValue({
      response: {
        header: {
          resultCode: "10",
          resultMsg: "INVALID_REQUEST_PARAMETER_ERROR",
        },
        body: {
          items: "",
          numOfRows: 0,
          pageNo: 1,
          totalCount: 0,
        },
      },
    });

    await expect(getTourDetailImages("127480")).rejects.toMatchObject({
      name: "TourApiError",
      type: "INVALID_REQUEST",
      resultCode: "10",
    });
  });
});

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  detailCommonFixture,
  emptyDetailCommonFixture,
} from "./__fixtures__/detail-common";
import { TOUR_API_CACHE } from "./cache";
import { requestTourApi } from "./client";
import { getTourDetailCommon } from "./detail-common";

vi.mock("./client", () => ({
  requestTourApi: vi.fn(),
}));

const mockedRequestTourApi =
  vi.mocked(requestTourApi);

describe("getTourDetailCommon", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedRequestTourApi.mockResolvedValue(
      structuredClone(detailCommonFixture),
    );
  });

  it("requests detailCommon2 with the normalized contentId", async () => {
    await getTourDetailCommon(" 127480 ");

    expect(
      mockedRequestTourApi,
    ).toHaveBeenCalledOnce();

    expect(
      mockedRequestTourApi,
    ).toHaveBeenCalledWith(
      "detailCommon2",
      {
        params: {
          contentId: "127480",
        },

        // 변경: 상세정보 캐시 정책 계약 검증
        cacheOptions:
          TOUR_API_CACHE.CONTENT_DETAIL,
      },
    );
  });

  it("returns null when detailCommon2 has no item", async () => {
    mockedRequestTourApi.mockResolvedValue(
      structuredClone(
        emptyDetailCommonFixture,
      ),
    );

    await expect(
      getTourDetailCommon("127480"),
    ).resolves.toBeNull();
  });

  it("rejects an empty contentId before requesting the API", async () => {
    await expect(
      getTourDetailCommon("   "),
    ).rejects.toThrow(
      "contentId is required",
    );

    expect(
      mockedRequestTourApi,
    ).not.toHaveBeenCalled();
  });

  // 변경: TourAPI resultCode 오류가 정상 결과로 처리되지 않는지 검증
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
      getTourDetailCommon("127480"),
    ).rejects.toMatchObject({
      name: "TourApiError",
      type: "INVALID_REQUEST",
      resultCode: "10",
    });
  });
});
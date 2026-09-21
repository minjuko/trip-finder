import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { getTourDetailCommon } from "./detail-common";
import { getTourDetailImages } from "./detail-image";
import {
  getTourDetailIntro,
  isSupportedDetailIntroContentTypeId,
} from "./detail-intro";
import { getTourDetail } from "./tour-detail";

vi.mock("./detail-common", () => ({
  getTourDetailCommon: vi.fn(),
}));

vi.mock("./detail-intro", () => ({
  getTourDetailIntro: vi.fn(),
  // 변경: orchestration의 contentType 분기를 실제 계약과 동일하게 mock
  isSupportedDetailIntroContentTypeId:
    vi.fn(
      (value: string) =>
        value === "12" ||
        value === "14" ||
        value === "39",
    ),
}));

vi.mock("./detail-image", () => ({
  getTourDetailImages: vi.fn(),
}));

const mockedGetTourDetailCommon =
  vi.mocked(getTourDetailCommon);

const mockedGetTourDetailIntro =
  vi.mocked(getTourDetailIntro);

const mockedGetTourDetailImages =
  vi.mocked(getTourDetailImages);

const mockedIsSupportedDetailIntroContentTypeId =
  vi.mocked(
    isSupportedDetailIntroContentTypeId,
  );

const commonFixture = {
  id: "127480",
  contentTypeId: "12",
  title: "가거도",

  address: {
    primary:
      "전남광주통합특별시 신안군 흑산면 가거도길 38-2",
    detail: null,
    zipCode: "58866",
  },

  thumbnail: {
    url: "http://tong.visitkorea.or.kr/cms/resource/28/3572128_image2_1.jpg",
    copyrightType: "Type1",
  },

  region: {
    regionCode: "12",
    districtCode: "870",
  },

  classification: {
    depth1: "NA",
    depth2: "NA02",
    depth3: "NA020500",
  },

  coordinates: {
    latitude: 34.0520609879,
    longitude: 125.1263860145,
  },

  homepage:
    "https://tour.shinan.go.kr/home/tour/island_tour/heuksan/place/place_12/page.wscms",

  overview: "가거도 상세 설명",
};

const informationFixture = [
  {
    key: "infocenter",
    label: "문의 및 안내",
    value: "061-246-5400",
  },
  {
    key: "restdate",
    label: "휴무일",
    value: "연중무휴",
  },
];

const imagesFixture = [
  {
    id: "3572129_3",
    url: "http://tong.visitkorea.or.kr/cms/resource/29/3572129_image2_1.jpg",
    thumbnailUrl:
      "http://tong.visitkorea.or.kr/cms/resource/29/3572129_image3_1.jpg",
    alt: "신안_가거도 (2)",
    copyrightType: "Type1",
  },
];

describe("getTourDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 변경: 기본 fixture는 지원 contentType으로 판별
    mockedIsSupportedDetailIntroContentTypeId.mockImplementation(
      (value: string) =>
        value === "12" ||
        value === "14" ||
        value === "39",
    );

    mockedGetTourDetailCommon.mockResolvedValue(
      structuredClone(commonFixture),
    );

    mockedGetTourDetailIntro.mockResolvedValue(
      structuredClone(
        informationFixture,
      ),
    );

    mockedGetTourDetailImages.mockResolvedValue(
      structuredClone(imagesFixture),
    );
  });

  it("combines common, intro, and image data into TourContentDetail", async () => {
    await expect(
      getTourDetail("127480"),
    ).resolves.toEqual({
      ...commonFixture,
      information: informationFixture,
      images: imagesFixture,
    });
  });

  it("uses common detail data when requesting intro and images", async () => {
    await getTourDetail("127480");

    expect(
      mockedGetTourDetailCommon,
    ).toHaveBeenCalledWith("127480");

    expect(
      mockedGetTourDetailIntro,
    ).toHaveBeenCalledWith({
      contentId: "127480",
      contentTypeId: "12",
    });

    expect(
      mockedGetTourDetailImages,
    ).toHaveBeenCalledWith(
      "127480",
    );
  });

  // 변경: Intro 계약을 검증하지 않은 contentType도
  // 상세 페이지 자체는 Common + Images로 정상 구성
  it("skips intro for an unsupported contentTypeId", async () => {
    mockedGetTourDetailCommon.mockResolvedValue({
      ...structuredClone(
        commonFixture,
      ),
      contentTypeId: "15",
    });

    const result =
      await getTourDetail("127480");

    expect(
      mockedIsSupportedDetailIntroContentTypeId,
    ).toHaveBeenCalledWith("15");

    expect(
      mockedGetTourDetailIntro,
    ).not.toHaveBeenCalled();

    expect(
      mockedGetTourDetailImages,
    ).toHaveBeenCalledWith(
      "127480",
    );

    expect(result).toEqual({
      ...commonFixture,
      contentTypeId: "15",
      information: [],
      images: imagesFixture,
    });
  });

  // 존재하지 않는 콘텐츠에서는 추가 API 호출 중단
  it("returns null without requesting intro or images when common detail does not exist", async () => {
    mockedGetTourDetailCommon.mockResolvedValue(
      null,
    );

    await expect(
      getTourDetail("999999999"),
    ).resolves.toBeNull();

    expect(
      mockedGetTourDetailIntro,
    ).not.toHaveBeenCalled();

    expect(
      mockedGetTourDetailImages,
    ).not.toHaveBeenCalled();
  });

  // intro가 없어도 유효한 상세 Domain 생성
  it("supports detail content without intro information", async () => {
    mockedGetTourDetailIntro.mockResolvedValue(
      [],
    );

    const result =
      await getTourDetail("127480");

    expect(result?.information).toEqual(
      [],
    );

    expect(result?.images).toEqual(
      imagesFixture,
    );
  });

  // 이미지가 없어도 유효한 상세 Domain 생성
  it("supports detail content without images", async () => {
    mockedGetTourDetailImages.mockResolvedValue(
      [],
    );

    const result =
      await getTourDetail("127480");

    expect(result?.images).toEqual([]);

    expect(result?.information).toEqual(
      informationFixture,
    );
  });

  // 하위 상세 API 오류를 숨기지 않고 호출 계층으로 전달
  it("propagates an intro request failure", async () => {
    mockedGetTourDetailIntro.mockRejectedValue(
      new Error(
        "detailIntro request failed",
      ),
    );

    await expect(
      getTourDetail("127480"),
    ).rejects.toThrow(
      "detailIntro request failed",
    );
  });

  it("propagates an image request failure", async () => {
    mockedGetTourDetailImages.mockRejectedValue(
      new Error(
        "detailImage request failed",
      ),
    );

    await expect(
      getTourDetail("127480"),
    ).rejects.toThrow(
      "detailImage request failed",
    );
  });
});
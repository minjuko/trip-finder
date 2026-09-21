import {
  describe,
  expect,
  it,
} from "vitest";

import { detailCommonFixture } from "../__fixtures__/detail-common";
import { normalizeTourDetailCommonItem } from "./detail-common";

const getFixtureItem = () => {
  const { items } =
    detailCommonFixture.response.body;

  if (items === "") {
    throw new Error(
      "detailCommonFixture must contain an item",
    );
  }

  return structuredClone(
    items.item[0],
  );
};

describe("normalizeTourDetailCommonItem", () => {
  it("normalizes detailCommon2 DTO to the domain model", () => {
    const result =
      normalizeTourDetailCommonItem(
        getFixtureItem(),
      );

    expect(result).toEqual({
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

      // 변경: API HTML을 UI에 노출하지 않고 href만 Domain에 저장
      homepage:
        "https://tour.shinan.go.kr/home/tour/island_tour/heuksan/place/place_12/page.wscms",

      overview: "가거도 상세 설명",
    });
  });

  // 변경: 실제 API에서 빈 문자열이 빈번한 계약 검증
  it("normalizes empty optional values to null", () => {
    const item = getFixtureItem();

    item.addr1 = "";
    item.addr2 = "";
    item.zipcode = "";
    item.firstimage = "";
    item.cpyrhtDivCd = "";
    item.lDongRegnCd = "";
    item.lDongSignguCd = "";
    item.lclsSystm1 = "";
    item.lclsSystm2 = "";
    item.lclsSystm3 = "";
    item.mapx = "";
    item.mapy = "";
    item.homepage = "";
    item.overview = "";

    expect(
      normalizeTourDetailCommonItem(item),
    ).toMatchObject({
      address: null,
      thumbnail: null,
      region: null,
      classification: null,
      coordinates: null,
      homepage: null,
      overview: null,
    });
  });

  it("preserves a plain homepage URL", () => {
    const item = getFixtureItem();

    item.homepage =
      "https://example.com/place";

    expect(
      normalizeTourDetailCommonItem(item)
        .homepage,
    ).toBe(
      "https://example.com/place",
    );
  });

  it("returns null for an unsupported homepage value", () => {
    const item = getFixtureItem();

    item.homepage =
      "홈페이지 준비 중";

    expect(
      normalizeTourDetailCommonItem(item)
        .homepage,
    ).toBeNull();
  });
});
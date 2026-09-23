import { describe, expect, it } from "vitest";

import {
  areaBasedListFixture,
  emptyTourListFixture,
} from "../__fixtures__/area-based-list";
import { tourListResponseSchema } from "../schemas/list";
import {
  normalizeTourListItem,
  normalizeTourListResponse,
} from "./tour-content";

const getFirstItem = () => {
  const parsed = tourListResponseSchema.parse(areaBasedListFixture);

  const { items } = parsed.response.body;

  if (items === "") {
    throw new Error("Expected a non-empty TourAPI fixture");
  }

  const [item] = items.item;

  if (!item) {
    throw new Error("Expected at least one TourAPI item");
  }

  return item;
};

describe("normalizeTourListItem", () => {
  it("converts a TourAPI DTO to the domain model", () => {
    const item = getFirstItem();

    const result = normalizeTourListItem(item);

    expect(result).toEqual({
      id: "127480",
      contentTypeId: "12",
      title: "가거도",
      address: {
        primary: "전남광주통합특별시 신안군 흑산면 가거도길 38-2",
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
    });
  });

  it("converts empty optional values to null", () => {
    const item = {
      ...getFirstItem(),
      addr1: "",
      addr2: "",
      zipcode: "",
      firstimage: "",
      cpyrhtDivCd: "",
      lDongRegnCd: "",
      lDongSignguCd: "",
      lclsSystm1: "",
      lclsSystm2: "",
      lclsSystm3: "",
    };

    const result = normalizeTourListItem(item);

    expect(result.address).toBeNull();
    expect(result.thumbnail).toBeNull();
    expect(result.region).toBeNull();
    expect(result.classification).toBeNull();
  });

  it("returns null coordinates when coordinate values are empty", () => {
    const item = {
      ...getFirstItem(),
      mapx: "",
      mapy: "",
    };

    expect(normalizeTourListItem(item).coordinates).toBeNull();
  });

  it("returns null coordinates when coordinate values are invalid", () => {
    const item = {
      ...getFirstItem(),
      mapx: "invalid",
      mapy: "34.0520609879",
    };

    expect(normalizeTourListItem(item).coordinates).toBeNull();
  });
});

describe("normalizeTourListResponse", () => {
  it("normalizes items and pagination metadata", () => {
    const parsed = tourListResponseSchema.parse(areaBasedListFixture);

    const result = normalizeTourListResponse(parsed);

    expect(result.items).toHaveLength(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(1);
    expect(result.totalCount).toBe(12611);
  });

  it("normalizes an empty TourAPI response to an empty item list", () => {
    const parsed = tourListResponseSchema.parse(emptyTourListFixture);

    const result = normalizeTourListResponse(parsed);

    expect(result.items).toEqual([]);
    expect(result.totalCount).toBe(0);
  });
});

import { describe, expect, it } from "vitest";

import {
  detailImageFixture,
  emptyDetailImageFixture,
} from "../__fixtures__/detail-image";
import {
  normalizeTourDetailImageItem,
  normalizeTourDetailImageResponse,
} from "./detail-image";

const getFixtureItem = () => {
  const { items } = detailImageFixture.response.body;

  if (items === "") {
    throw new Error("detailImageFixture must contain an item");
  }

  return structuredClone(items.item[0]);
};

describe("normalizeTourDetailImageItem", () => {
  it("normalizes detailImage2 DTO to TourImage", () => {
    expect(normalizeTourDetailImageItem(getFixtureItem())).toEqual({
      id: "3572129_3",
      url: "http://tong.visitkorea.or.kr/cms/resource/29/3572129_image2_1.jpg",
      thumbnailUrl:
        "http://tong.visitkorea.or.kr/cms/resource/29/3572129_image3_1.jpg",
      alt: "신안_가거도 (2)",
      copyrightType: "Type1",
    });
  });

  it("normalizes empty optional image values to null", () => {
    const item = getFixtureItem();

    item.smallimageurl = "";
    item.imgname = "";
    item.cpyrhtDivCd = "";

    expect(normalizeTourDetailImageItem(item)).toMatchObject({
      thumbnailUrl: null,
      alt: null,
      copyrightType: null,
    });
  });

  // 변경: serialnum이 없더라도 안정적인 식별값을 유지
  it("uses the image URL as an id when serialnum is empty", () => {
    const item = getFixtureItem();

    item.serialnum = "";

    const result = normalizeTourDetailImageItem(item);

    expect(result?.id).toBe(item.originimgurl);
  });

  // 변경: 원본 이미지 URL 없는 잘못된 이미지 DTO 제외
  it("returns null when the original image URL is empty", () => {
    const item = getFixtureItem();

    item.originimgurl = "";

    expect(normalizeTourDetailImageItem(item)).toBeNull();
  });
});

describe("normalizeTourDetailImageResponse", () => {
  it("normalizes an empty TourAPI image response to an empty array", () => {
    expect(normalizeTourDetailImageResponse(emptyDetailImageFixture)).toEqual(
      [],
    );
  });
});

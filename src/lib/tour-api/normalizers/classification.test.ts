import { describe, expect, it } from "vitest";

import {
  classificationDepth2Fixture,
  classificationDepth3Fixture,
  classificationFixture,
} from "../__fixtures__/classification";
import { classificationResponseSchema } from "../schemas/classification";
import {
  normalizeClassificationItem,
  normalizeClassificationResponse,
} from "./classification";

const getFirstClassificationItem = () => {
  const parsed = classificationResponseSchema.parse(classificationFixture);

  const { items } = parsed.response.body;

  if (items === "") {
    throw new Error("Expected a non-empty classification fixture");
  }

  const [item] = items.item;

  if (!item) {
    throw new Error("Expected at least one classification item");
  }

  return item;
};

describe("normalizeClassificationItem", () => {
  it("converts an lclsSystmCode2 item to the domain model", () => {
    const result = normalizeClassificationItem(getFirstClassificationItem());

    expect(result).toEqual({
      code: "AC",
      name: "숙박",
    });
  });

  it("trims classification code and name", () => {
    const item = {
      ...getFirstClassificationItem(),
      code: " AC ",
      name: " 숙박 ",
    };

    const result = normalizeClassificationItem(item);

    expect(result).toEqual({
      code: "AC",
      name: "숙박",
    });
  });
});

describe("normalizeClassificationResponse", () => {
  it("normalizes depth 1 classifications", () => {
    const parsed = classificationResponseSchema.parse(classificationFixture);

    const result = normalizeClassificationResponse(parsed);

    expect(result).toHaveLength(10);
    expect(result[0]).toEqual({
      code: "AC",
      name: "숙박",
    });
    expect(result[9]).toEqual({
      code: "VE",
      name: "문화관광",
    });
  });

  // 변경: depth 2도 동일 Domain 타입으로 정규화
  it("normalizes depth 2 classifications", () => {
    const parsed = classificationResponseSchema.parse(
      classificationDepth2Fixture,
    );

    const result = normalizeClassificationResponse(parsed);

    expect(result).toHaveLength(5);
    expect(result[1]).toEqual({
      code: "NA02",
      name: "자연경관(하천‧해양)",
    });
  });

  // 변경: depth 3도 동일 Domain 타입으로 정규화
  it("normalizes depth 3 classifications", () => {
    const parsed = classificationResponseSchema.parse(
      classificationDepth3Fixture,
    );

    const result = normalizeClassificationResponse(parsed);

    expect(result).toHaveLength(9);
    expect(result[0]).toEqual({
      code: "NA020100",
      name: "강",
    });
    expect(result[8]).toEqual({
      code: "NA020900",
      name: "해변. 해수욕장",
    });
  });
});

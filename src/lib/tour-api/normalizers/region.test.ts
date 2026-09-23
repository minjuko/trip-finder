import { describe, expect, it } from "vitest";

import { regionFixture } from "../__fixtures__/region";
import { regionResponseSchema } from "../schemas/region";
import { normalizeRegionItem, normalizeRegionResponse } from "./region";

const getFirstRegionItem = () => {
  const parsed = regionResponseSchema.parse(regionFixture);

  const { items } = parsed.response.body;

  if (items === "") {
    throw new Error("Expected a non-empty region fixture");
  }

  const [item] = items.item;

  if (!item) {
    throw new Error("Expected at least one region item");
  }

  return item;
};

describe("normalizeRegionItem", () => {
  it("converts an ldongCode2 item to the domain model", () => {
    const result = normalizeRegionItem(getFirstRegionItem());

    expect(result).toEqual({
      code: "11",
      name: "서울특별시",
    });
  });

  it("trims region code and name", () => {
    const item = {
      ...getFirstRegionItem(),
      code: " 11 ",
      name: " 서울특별시 ",
    };

    const result = normalizeRegionItem(item);

    expect(result).toEqual({
      code: "11",
      name: "서울특별시",
    });
  });
});

describe("normalizeRegionResponse", () => {
  it("normalizes all region items", () => {
    const parsed = regionResponseSchema.parse(regionFixture);

    const result = normalizeRegionResponse(parsed);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      code: "11",
      name: "서울특별시",
    });
  });
});

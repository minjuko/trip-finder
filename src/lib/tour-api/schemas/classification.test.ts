import { describe, expect, it } from "vitest";

import {
  classificationDepth2Fixture,
  classificationDepth3Fixture,
  classificationFixture,
} from "../__fixtures__/classification";
import { classificationResponseSchema } from "./classification";

describe("classificationResponseSchema", () => {
  it("validates a valid depth 1 lclsSystmCode2 response", () => {
    const result = classificationResponseSchema.safeParse(
      classificationFixture,
    );

    expect(result.success).toBe(true);
  });

  // 변경: depth 2 응답도 동일 schema로 검증
  it("validates a valid depth 2 lclsSystmCode2 response", () => {
    const result = classificationResponseSchema.safeParse(
      classificationDepth2Fixture,
    );

    expect(result.success).toBe(true);
  });

  // 변경: depth 3 응답도 동일 schema로 검증
  it("validates a valid depth 3 lclsSystmCode2 response", () => {
    const result = classificationResponseSchema.safeParse(
      classificationDepth3Fixture,
    );

    expect(result.success).toBe(true);
  });

  it("rejects a classification with an invalid code type", () => {
    const invalidFixture = structuredClone(classificationFixture);

    const item = invalidFixture.response.body.items.item[0] as Record<
      string,
      unknown
    >;

    item.code = 123;

    const result = classificationResponseSchema.safeParse(invalidFixture);

    expect(result.success).toBe(false);
  });

  it("rejects a classification without a name", () => {
    const invalidFixture = structuredClone(classificationFixture);

    const item = invalidFixture.response.body.items.item[0] as Record<
      string,
      unknown
    >;

    delete item.name;

    const result = classificationResponseSchema.safeParse(invalidFixture);

    expect(result.success).toBe(false);
  });
});

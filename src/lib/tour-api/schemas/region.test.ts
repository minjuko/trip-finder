import { describe, expect, it } from "vitest";

import {
  districtFixture,
  regionFixture,
} from "../__fixtures__/region";
import { regionResponseSchema } from "./region";

describe("regionResponseSchema", () => {
  it("validates a valid top-level ldongCode2 response", () => {
    const result =
      regionResponseSchema.safeParse(regionFixture);

    expect(result.success).toBe(true);
  });

  // 변경: 동일 schema로 시군구 응답도 검증되는지 확인
  it("validates a valid district ldongCode2 response", () => {
    const result =
      regionResponseSchema.safeParse(districtFixture);

    expect(result.success).toBe(true);
  });

  it("rejects a region with an invalid code type", () => {
    const invalidFixture = structuredClone(regionFixture);

    const item = invalidFixture.response.body.items.item[0] as Record<
      string,
      unknown
    >;

    item.code = 11;

    const result =
      regionResponseSchema.safeParse(invalidFixture);

    expect(result.success).toBe(false);
  });

  it("rejects a region without a name", () => {
    const invalidFixture = structuredClone(regionFixture);

    const item = invalidFixture.response.body.items.item[0] as Record<
      string,
      unknown
    >;

    delete item.name;

    const result =
      regionResponseSchema.safeParse(invalidFixture);

    expect(result.success).toBe(false);
  });
});
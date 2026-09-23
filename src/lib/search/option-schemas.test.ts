import { describe, expect, it } from "vitest";

import {
  classificationOptionResponseSchema,
  regionOptionResponseSchema,
} from "./option-schemas";

describe("search option response schemas", () => {
  it("accepts valid region options", () => {
    expect(
      regionOptionResponseSchema.parse([{ code: "11", name: "서울특별시" }]),
    ).toEqual([{ code: "11", name: "서울특별시" }]);
  });

  it("rejects malformed classification options", () => {
    expect(
      classificationOptionResponseSchema.safeParse([{ code: "", name: "" }])
        .success,
    ).toBe(false);
  });
});

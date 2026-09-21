import { describe, expect, it } from "vitest";

import {
  areaBasedListFixture,
  emptyTourListFixture,
} from "../__fixtures__/area-based-list";
import { tourListResponseSchema } from "./list";

describe("tourListResponseSchema", () => {
  it("validates a valid TourAPI list response", () => {
    const result =
      tourListResponseSchema.safeParse(areaBasedListFixture);

    expect(result.success).toBe(true);
  });

  it("rejects a response with an invalid item field type", () => {
    const invalidFixture = structuredClone(areaBasedListFixture);

    invalidFixture.response.body.items.item[0].mapx = 125.1263860145 as never;

    const result =
      tourListResponseSchema.safeParse(invalidFixture);

    expect(result.success).toBe(false);
    
  });

  it("rejects a response without required contentid", () => {
    const invalidFixture = structuredClone(
      areaBasedListFixture,
    ) as Record<string, unknown>;

    const response = invalidFixture.response as {
      body: {
        items: {
          item: Array<Record<string, unknown>>;
        };
      };
    };

    delete response.body.items.item[0].contentid;

    const result =
      tourListResponseSchema.safeParse(invalidFixture);

    expect(result.success).toBe(false);
  });
   it("accepts an empty TourAPI list response", () => {
    const result =
      tourListResponseSchema.safeParse(emptyTourListFixture);

    expect(result.success).toBe(true);
  });
});
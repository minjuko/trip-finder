import { describe, expect, it } from "vitest";

import { getExploreArrange } from "./explore-sort";

describe("getExploreArrange", () => {
  it.each([
    ["title", false, "A"],
    ["modified", false, "C"],
    ["created", false, "D"],
    ["title", true, "O"],
    ["modified", true, "Q"],
    ["created", true, "R"],
  ] as const)(
    "maps %s with imageOnly=%s to %s",
    (sort, imageOnly, expected) => {
      expect(getExploreArrange(sort, imageOnly)).toBe(expected);
    },
  );
});

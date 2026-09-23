import { describe, expect, it } from "vitest";

import { normalizeTourDetailInfo } from "./detail-info";

describe("normalizeTourDetailInfo", () => {
  it("keeps distinct rows with the same content ID and removes exact duplicates", () => {
    const first = {
      contentid: "127480",
      infoname: "문의 및 안내",
      infotext: "관광안내소",
    };
    const second = {
      contentid: "127480",
      infoname: "쉬는 날",
      infotext: "연중무휴",
    };

    const result = normalizeTourDetailInfo([first, { ...first }, second]);

    expect(result).toEqual([
      {
        id: "127480|문의 및 안내|관광안내소",
        title: "문의 및 안내",
        description: "관광안내소",
      },
      {
        id: "127480|쉬는 날|연중무휴",
        title: "쉬는 날",
        description: "연중무휴",
      },
    ]);
  });
});

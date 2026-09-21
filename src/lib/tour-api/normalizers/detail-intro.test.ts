import {
  describe,
  expect,
  it,
} from "vitest";

import {
  cultureIntroFixture,
  foodIntroFixture,
  touristAttractionIntroFixture,
} from "../__fixtures__/detail-intro";
import {
  cultureIntroItemSchema,
  foodIntroItemSchema,
  touristAttractionIntroItemSchema,
} from "../schemas/detail-intro";
import { normalizeTourDetailIntroItem } from "./detail-intro";

// 변경: fixture를 실제 Zod schema로 검증하면서
// 각 contentType에 맞는 DTO 타입을 유지
const getTouristAttractionItem = () => {
  const { items } =
    touristAttractionIntroFixture.response
      .body;

  if (items === "") {
    throw new Error(
      "touristAttractionIntroFixture must contain an item",
    );
  }

  return touristAttractionIntroItemSchema.parse(
    structuredClone(items.item[0]),
  );
};

const getCultureItem = () => {
  const { items } =
    cultureIntroFixture.response.body;

  if (items === "") {
    throw new Error(
      "cultureIntroFixture must contain an item",
    );
  }

  return cultureIntroItemSchema.parse(
    structuredClone(items.item[0]),
  );
};

const getFoodItem = () => {
  const { items } =
    foodIntroFixture.response.body;

  if (items === "") {
    throw new Error(
      "foodIntroFixture must contain an item",
    );
  }

  return foodIntroItemSchema.parse(
    structuredClone(items.item[0]),
  );
};

describe("normalizeTourDetailIntroItem", () => {
  // 변경: contentTypeId 12 관광지 실제 응답 → 공통 InformationItem[]
  it("normalizes tourist attraction information", () => {
    const item =
      getTouristAttractionItem();

    expect(
      normalizeTourDetailIntroItem(item),
    ).toEqual([
      {
        key: "infocenter",
        label: "문의 및 안내",
        value: "061-246-5400",
      },
      {
        key: "restdate",
        label: "휴무일",
        value: "연중무휴",
      },
      {
        key: "expagerange",
        label: "체험 가능 연령",
        value: "전 연령",
      },
      {
        key: "usetime",
        label: "이용 시간",
        value: "상시 개방",
      },
    ]);
  });

  // 변경: contentTypeId 14 문화시설 실제 응답 계약 검증
  it("normalizes culture information", () => {
    const item = getCultureItem();

    expect(
      normalizeTourDetailIntroItem(item),
    ).toEqual([
      {
        key: "infocenter",
        label: "문의 및 안내",
        value: "0507-1486-4982",
      },
      {
        key: "usefee",
        label: "이용 요금",
        value: "1인 5,000원",
      },
      {
        key: "usetime",
        label: "이용 시간",
        value: "07:00~24:00",
      },
      {
        key: "restdate",
        label: "휴무일",
        value: "연중무휴",
      },
      {
        key: "parking",
        label: "주차",
        value: "불가능",
      },
    ]);
  });

  // 변경: contentTypeId 39 음식점 실제 응답 계약 검증
  it("normalizes food information", () => {
    const item = getFoodItem();

    expect(
      normalizeTourDetailIntroItem(item),
    ).toEqual([
      {
        key: "infocenter",
        label: "문의 및 안내",
        value: "051-634-5303",
      },
      {
        key: "firstmenu",
        label: "대표 메뉴",
        value:
          "카이젠모밀 돈까스 세트 / 모듬후라이 정식",
      },
      {
        key: "treatmenu",
        label: "취급 메뉴",
        value:
          "카이젠모밀 / 카이젠 냉우동 / 판모밀 / 가가와어묵우동세트 / 생선가스정식 외",
      },
      {
        key: "opentime",
        label: "영업 시간",
        value:
          "11:00~17:00 (주문 마감 16:00)",
      },
      {
        key: "restdate",
        label: "휴무일",
        value:
          "매주 일요일, 월요일",
      },
      {
        key: "packing",
        label: "포장",
        value: "가능",
      },
      {
        key: "chkcreditcard",
        label: "신용카드",
        value: "가능",
      },
      {
        key: "kidsfacility",
        label: "어린이 시설",
        value: "0",
      },
    ]);
  });

  // 변경: API의 빈 문자열 필드는 UI 정보 목록에서 제거
  it("omits empty information values", () => {
    const item =
      getTouristAttractionItem();

    item.infocenter = "";
    item.restdate = "";
    item.expagerange = "";
    item.usetime = "";

    expect(
      normalizeTourDetailIntroItem(item),
    ).toEqual([]);
  });

  it("trims information values", () => {
    const item = getCultureItem();

    item.usefee = "  1인 5,000원  ";

    const result =
      normalizeTourDetailIntroItem(item);

    expect(
      result.find(
        ({ key }) => key === "usefee",
      ),
    ).toEqual({
      key: "usefee",
      label: "이용 요금",
      value: "1인 5,000원",
    });
  });
});
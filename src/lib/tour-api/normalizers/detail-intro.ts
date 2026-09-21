import type { InformationItem } from "@/types/tour";

import type {
  CultureIntroItemDto,
  FoodIntroItemDto,
  TourDetailIntroItemDto,
  TouristAttractionIntroItemDto,
} from "../schemas/detail-intro";

const createInformationItem = (
  key: string,
  label: string,
  value: string,
): InformationItem | null => {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  return {
    key,
    label,
    value: normalizedValue,
  };
};

const removeEmptyItems = (
  items: Array<InformationItem | null>,
): InformationItem[] =>
  items.filter(
    (item): item is InformationItem =>
      item !== null,
  );

// 변경: 관광지에서 사용자에게 의미 있는 이용정보만 Domain 모델로 변환
const normalizeTouristAttractionIntro = (
  item: TouristAttractionIntroItemDto,
): InformationItem[] =>
  removeEmptyItems([
    createInformationItem(
      "infocenter",
      "문의 및 안내",
      item.infocenter,
    ),
    createInformationItem(
      "opendate",
      "개장일",
      item.opendate,
    ),
    createInformationItem(
      "restdate",
      "휴무일",
      item.restdate,
    ),
    createInformationItem(
      "expguide",
      "체험 안내",
      item.expguide,
    ),
    createInformationItem(
      "expagerange",
      "체험 가능 연령",
      item.expagerange,
    ),
    createInformationItem(
      "accomcount",
      "수용 인원",
      item.accomcount,
    ),
    createInformationItem(
      "useseason",
      "이용 시기",
      item.useseason,
    ),
    createInformationItem(
      "usetime",
      "이용 시간",
      item.usetime,
    ),
    createInformationItem(
      "parking",
      "주차",
      item.parking,
    ),
    createInformationItem(
      "chkbabycarriage",
      "유모차 대여",
      item.chkbabycarriage,
    ),
    createInformationItem(
      "chkpet",
      "반려동물 동반",
      item.chkpet,
    ),
    createInformationItem(
      "chkcreditcard",
      "신용카드",
      item.chkcreditcard,
    ),
  ]);

// 변경: 문화시설 전용 필드를 공통 InformationItem으로 변환
const normalizeCultureIntro = (
  item: CultureIntroItemDto,
): InformationItem[] =>
  removeEmptyItems([
    createInformationItem(
      "infocenter",
      "문의 및 안내",
      item.infocenterculture,
    ),
    createInformationItem(
      "usefee",
      "이용 요금",
      item.usefee,
    ),
    createInformationItem(
      "discountinfo",
      "할인 정보",
      item.discountinfo,
    ),
    createInformationItem(
      "usetime",
      "이용 시간",
      item.usetimeculture,
    ),
    createInformationItem(
      "restdate",
      "휴무일",
      item.restdateculture,
    ),
    createInformationItem(
      "spendtime",
      "관람 소요 시간",
      item.spendtime,
    ),
    createInformationItem(
      "scale",
      "규모",
      item.scale,
    ),
    createInformationItem(
      "accomcount",
      "수용 인원",
      item.accomcountculture,
    ),
    createInformationItem(
      "parking",
      "주차",
      item.parkingculture,
    ),
    createInformationItem(
      "parkingfee",
      "주차 요금",
      item.parkingfee,
    ),
    createInformationItem(
      "chkbabycarriage",
      "유모차 대여",
      item.chkbabycarriageculture,
    ),
    createInformationItem(
      "chkpet",
      "반려동물 동반",
      item.chkpetculture,
    ),
    createInformationItem(
      "chkcreditcard",
      "신용카드",
      item.chkcreditcardculture,
    ),
  ]);

// 변경: 음식점 전용 필드를 공통 InformationItem으로 변환
const normalizeFoodIntro = (
  item: FoodIntroItemDto,
): InformationItem[] =>
  removeEmptyItems([
    createInformationItem(
      "infocenter",
      "문의 및 안내",
      item.infocenterfood,
    ),
    createInformationItem(
      "firstmenu",
      "대표 메뉴",
      item.firstmenu,
    ),
    createInformationItem(
      "treatmenu",
      "취급 메뉴",
      item.treatmenu,
    ),
    createInformationItem(
      "opentime",
      "영업 시간",
      item.opentimefood,
    ),
    createInformationItem(
      "restdate",
      "휴무일",
      item.restdatefood,
    ),
    createInformationItem(
      "packing",
      "포장",
      item.packing,
    ),
    createInformationItem(
      "parking",
      "주차",
      item.parkingfood,
    ),
    createInformationItem(
      "reservation",
      "예약",
      item.reservationfood,
    ),
    createInformationItem(
      "chkcreditcard",
      "신용카드",
      item.chkcreditcardfood,
    ),
    createInformationItem(
      "discountinfo",
      "할인 정보",
      item.discountinfofood,
    ),
    createInformationItem(
      "kidsfacility",
      "어린이 시설",
      item.kidsfacility,
    ),
    createInformationItem(
      "seat",
      "좌석",
      item.seat,
    ),
    createInformationItem(
      "scale",
      "규모",
      item.scalefood,
    ),
  ]);

export const normalizeTourDetailIntroItem = (
  item: TourDetailIntroItemDto,
): InformationItem[] => {
  // 변경: discriminated union으로 contentType별 정규화 함수를 안전하게 선택
  switch (item.contenttypeid) {
    case "12":
      return normalizeTouristAttractionIntro(
        item,
      );

    case "14":
      return normalizeCultureIntro(item);

    case "39":
      return normalizeFoodIntro(item);
  }
};
import { z } from "zod";

import { createTourApiResponseSchema } from "./common";

// 변경: contentTypeId 12 관광지의 실제 detailIntro2 응답 계약
export const touristAttractionIntroItemSchema =
  z.object({
    contentid: z.string(),
    contenttypeid: z.literal("12"),

    heritage1: z.string(),
    heritage2: z.string(),
    heritage3: z.string(),

    infocenter: z.string(),
    opendate: z.string(),
    restdate: z.string(),
    expguide: z.string(),
    expagerange: z.string(),
    accomcount: z.string(),
    useseason: z.string(),
    usetime: z.string(),
    parking: z.string(),
    chkbabycarriage: z.string(),
    chkpet: z.string(),
    chkcreditcard: z.string(),
  });

// 변경: contentTypeId 14 문화시설의 실제 detailIntro2 응답 계약
export const cultureIntroItemSchema = z.object({
  contentid: z.string(),
  contenttypeid: z.literal("14"),

  scale: z.string(),
  usefee: z.string(),
  discountinfo: z.string(),
  spendtime: z.string(),
  parkingfee: z.string(),

  infocenterculture: z.string(),
  accomcountculture: z.string(),
  usetimeculture: z.string(),
  restdateculture: z.string(),
  parkingculture: z.string(),

  chkbabycarriageculture: z.string(),
  chkpetculture: z.string(),
  chkcreditcardculture: z.string(),
});

// 변경: contentTypeId 39 음식점의 실제 detailIntro2 응답 계약
export const foodIntroItemSchema = z.object({
  contentid: z.string(),
  contenttypeid: z.literal("39"),

  seat: z.string(),
  kidsfacility: z.string(),

  firstmenu: z.string(),
  treatmenu: z.string(),

  smoking: z.string(),
  packing: z.string(),

  infocenterfood: z.string(),
  scalefood: z.string(),
  parkingfood: z.string(),
  opendatefood: z.string(),
  opentimefood: z.string(),
  restdatefood: z.string(),
  discountinfofood: z.string(),
  chkcreditcardfood: z.string(),
  reservationfood: z.string(),

  lcnsno: z.string(),
});

// 변경: 현재 MVP에서 지원하는 세 contentType을 discriminated union으로 검증
export const tourDetailIntroItemSchema =
  z.discriminatedUnion("contenttypeid", [
    touristAttractionIntroItemSchema,
    cultureIntroItemSchema,
    foodIntroItemSchema,
  ]);

export const tourDetailIntroResponseSchema =
  createTourApiResponseSchema(
    tourDetailIntroItemSchema,
  );

export type TouristAttractionIntroItemDto =
  z.infer<
    typeof touristAttractionIntroItemSchema
  >;

export type CultureIntroItemDto = z.infer<
  typeof cultureIntroItemSchema
>;

export type FoodIntroItemDto = z.infer<
  typeof foodIntroItemSchema
>;

export type TourDetailIntroItemDto = z.infer<
  typeof tourDetailIntroItemSchema
>;

export type TourDetailIntroResponseDto =
  z.infer<
    typeof tourDetailIntroResponseSchema
  >;
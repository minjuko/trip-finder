import type { TourDetailIntroResponseDto } from "../schemas/detail-intro";

export const touristAttractionIntroFixture: TourDetailIntroResponseDto = {
  response: {
    header: {
      resultCode: "0000",
      resultMsg: "OK",
    },
    body: {
      items: {
        item: [
          {
            contentid: "127480",
            contenttypeid: "12",
            heritage1: "0",
            heritage2: "0",
            heritage3: "0",
            infocenter: "061-246-5400",
            opendate: "",
            restdate: "연중무휴",
            expguide: "",
            expagerange: "전 연령",
            accomcount: "",
            useseason: "",
            usetime: "상시 개방",
            parking: "",
            chkbabycarriage: "",
            chkpet: "",
            chkcreditcard: "",
          },
        ],
      },
      numOfRows: 1,
      pageNo: 1,
      totalCount: 1,
    },
  },
};

export const cultureIntroFixture: TourDetailIntroResponseDto = {
  response: {
    header: {
      resultCode: "0000",
      resultMsg: "OK",
    },
    body: {
      items: {
        item: [
          {
            contentid: "2750143",
            contenttypeid: "14",
            scale: "",
            usefee: "1인 5,000원",
            discountinfo: "",
            spendtime: "",
            parkingfee: "",
            infocenterculture: "0507-1486-4982",
            accomcountculture: "",
            usetimeculture: "07:00~24:00",
            restdateculture: "연중무휴",
            parkingculture: "불가능",
            chkbabycarriageculture: "",
            chkpetculture: "",
            chkcreditcardculture: "",
          },
        ],
      },
      numOfRows: 1,
      pageNo: 1,
      totalCount: 1,
    },
  },
};

export const foodIntroFixture: TourDetailIntroResponseDto = {
  response: {
    header: {
      resultCode: "0000",
      resultMsg: "OK",
    },
    body: {
      items: {
        item: [
          {
            contentid: "2805408",
            contenttypeid: "39",
            seat: "",
            kidsfacility: "0",
            firstmenu: "카이젠모밀 돈까스 세트 / 모듬후라이 정식",
            treatmenu:
              "카이젠모밀 / 카이젠 냉우동 / 판모밀 / 가가와어묵우동세트 / 생선가스정식 외",
            smoking: "",
            packing: "가능",
            infocenterfood: "051-634-5303",
            scalefood: "",
            parkingfood: "",
            opendatefood: "",
            opentimefood: "11:00~17:00 (주문 마감 16:00)",
            restdatefood: "매주 일요일, 월요일",
            discountinfofood: "",
            chkcreditcardfood: "가능",
            reservationfood: "",
            lcnsno: "19820131136",
          },
        ],
      },
      numOfRows: 1,
      pageNo: 1,
      totalCount: 1,
    },
  },
};

export const emptyDetailIntroFixture: TourDetailIntroResponseDto = {
  response: {
    header: {
      resultCode: "0000",
      resultMsg: "OK",
    },
    body: {
      items: "",
      numOfRows: 0,
      pageNo: 1,
      totalCount: 0,
    },
  },
};

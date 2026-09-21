import type { TourDetailCommonResponseDto } from "../schemas/detail-common";

export const detailCommonFixture: TourDetailCommonResponseDto = {
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
            title: "가거도",
            createdtime: "20030905090000",
            modifiedtime: "20260630184428",
            tel: "",
            telname: "",
            homepage:
              '<a href="https://tour.shinan.go.kr/home/tour/island_tour/heuksan/place/place_12/page.wscms" target="_blank" title="새창 : 홈페이지로 이동">https://tour.shinan.go.kr</a>',
            firstimage:
              "http://tong.visitkorea.or.kr/cms/resource/28/3572128_image2_1.jpg",
            firstimage2:
              "http://tong.visitkorea.or.kr/cms/resource/28/3572128_image3_1.jpg",
            cpyrhtDivCd: "Type1",
            areacode: "38",
            sigungucode: "12",
            lDongRegnCd: "12",
            lDongSignguCd: "870",
            lclsSystm1: "NA",
            lclsSystm2: "NA02",
            lclsSystm3: "NA020500",
            cat1: "A01",
            cat2: "A0101",
            cat3: "A01011300",
            addr1: "전남광주통합특별시 신안군 흑산면 가거도길 38-2",
            addr2: "",
            zipcode: "58866",
            mapx: "125.1263860145",
            mapy: "34.0520609879",
            mlevel: "6",
            overview: "가거도 상세 설명",
          },
        ],
      },
      numOfRows: 1,
      pageNo: 1,
      totalCount: 1,
    },
  },
};

export const emptyDetailCommonFixture: TourDetailCommonResponseDto = {
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

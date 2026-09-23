export const areaBasedListFixture = {
  response: {
    header: {
      resultCode: "0000",
      resultMsg: "OK",
    },
    body: {
      items: {
        item: [
          {
            addr1: "전남광주통합특별시 신안군 흑산면 가거도길 38-2",
            addr2: "",
            zipcode: "58866",
            contentid: "127480",
            contenttypeid: "12",
            title: "가거도",
            tel: "",
            firstimage:
              "http://tong.visitkorea.or.kr/cms/resource/28/3572128_image2_1.jpg",
            firstimage2: "",
            cpyrhtDivCd: "Type1",
            mapx: "125.1263860145",
            mapy: "34.0520609879",
            mlevel: "6",
            createdtime: "",
            modifiedtime: "",
            areacode: "",
            sigungucode: "",
            cat1: "",
            cat2: "",
            cat3: "",
            lDongRegnCd: "12",
            lDongSignguCd: "870",
            lclsSystm1: "NA",
            lclsSystm2: "NA02",
            lclsSystm3: "NA020500",
          },
        ],
      },
      numOfRows: 1,
      pageNo: 1,
      totalCount: 12611,
    },
  },
};

export const emptyTourListFixture = {
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

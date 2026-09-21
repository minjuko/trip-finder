export const regionFixture = {
  response: {
    header: {
      resultCode: "0000",
      resultMsg: "OK",
    },
    body: {
      items: {
        item: [
          {
            rnum: 1,
            code: "11",
            name: "서울특별시",
          },
          {
            rnum: 2,
            code: "12",
            name: "전남광주통합특별시",
          },
          {
            rnum: 3,
            code: "26",
            name: "부산광역시",
          },
        ],
      },
      numOfRows: 16,
      pageNo: 1,
      totalCount: 16,
    },
  },
};

// 변경: lDongRegnCd=11 실제 응답을 기반으로 시군구 fixture 추가
export const districtFixture = {
  response: {
    header: {
      resultCode: "0000",
      resultMsg: "OK",
    },
    body: {
      items: {
        item: [
          {
            rnum: 1,
            code: "110",
            name: "종로구",
          },
          {
            rnum: 2,
            code: "140",
            name: "중구",
          },
          {
            rnum: 3,
            code: "170",
            name: "용산구",
          },
        ],
      },
      numOfRows: 25,
      pageNo: 1,
      totalCount: 25,
    },
  },
};
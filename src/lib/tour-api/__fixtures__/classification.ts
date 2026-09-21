export const classificationFixture = {
  response: {
    header: {
      resultCode: "0000",
      resultMsg: "OK",
    },
    body: {
      items: {
        item: [
          {
            code: "AC",
            name: "숙박",
            rnum: 1,
          },
          {
            code: "C01",
            name: "추천코스",
            rnum: 2,
          },
          {
            code: "EV",
            name: "축제/공연/행사",
            rnum: 3,
          },
          {
            code: "EX",
            name: "체험관광",
            rnum: 4,
          },
          {
            code: "FD",
            name: "음식",
            rnum: 5,
          },
          {
            code: "HS",
            name: "역사관광",
            rnum: 6,
          },
          {
            code: "LS",
            name: "레저스포츠",
            rnum: 7,
          },
          {
            code: "NA",
            name: "자연관광",
            rnum: 8,
          },
          {
            code: "SH",
            name: "쇼핑",
            rnum: 9,
          },
          {
            code: "VE",
            name: "문화관광",
            rnum: 10,
          },
        ],
      },
      numOfRows: 10,
      pageNo: 1,
      totalCount: 10,
    },
  },
};

export const classificationDepth2Fixture = {
  response: {
    header: {
      resultCode: "0000",
      resultMsg: "OK",
    },
    body: {
      items: {
        item: [
          {
            code: "NA01",
            name: "자연경관(산)",
            rnum: 1,
          },
          {
            code: "NA02",
            name: "자연경관(하천‧해양)",
            rnum: 2,
          },
          {
            code: "NA03",
            name: "자연생태",
            rnum: 3,
          },
          {
            code: "NA04",
            name: "자연공원",
            rnum: 4,
          },
          {
            code: "NA05",
            name: "기타자연관광",
            rnum: 5,
          },
        ],
      },
      numOfRows: 5,
      pageNo: 1,
      totalCount: 5,
    },
  },
};

export const classificationDepth3Fixture = {
  response: {
    header: {
      resultCode: "0000",
      resultMsg: "OK",
    },
    body: {
      items: {
        item: [
          {
            code: "NA020100",
            name: "강",
            rnum: 1,
          },
          {
            code: "NA020200",
            name: "호수",
            rnum: 2,
          },
          {
            code: "NA020300",
            name: "저수지",
            rnum: 3,
          },
          {
            code: "NA020400",
            name: "연못·늪",
            rnum: 4,
          },
          {
            code: "NA020500",
            name: "섬",
            rnum: 5,
          },
          {
            code: "NA020600",
            name: "염전",
            rnum: 6,
          },
          {
            code: "NA020700",
            name: "항구/포구",
            rnum: 7,
          },
          {
            code: "NA020800",
            name: "해안절경",
            rnum: 8,
          },
          {
            code: "NA020900",
            name: "해변. 해수욕장",
            rnum: 9,
          },
        ],
      },
      numOfRows: 9,
      pageNo: 1,
      totalCount: 9,
    },
  },
};
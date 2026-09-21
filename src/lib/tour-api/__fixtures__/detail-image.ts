export const detailImageFixture = {
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
            originimgurl:
              "http://tong.visitkorea.or.kr/cms/resource/29/3572129_image2_1.jpg",
            imgname: "신안_가거도 (2)",
            smallimageurl:
              "http://tong.visitkorea.or.kr/cms/resource/29/3572129_image3_1.jpg",
            cpyrhtDivCd: "Type1",
            serialnum: "3572129_3",
          },
        ],
      },
      numOfRows: 1,
      pageNo: 1,
      totalCount: 1,
    },
  },
};

export const emptyDetailImageFixture = {
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
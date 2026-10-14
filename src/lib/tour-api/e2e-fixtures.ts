import { areaBasedListFixture } from "./__fixtures__/area-based-list";
import {
  classificationDepth2Fixture,
  classificationDepth3Fixture,
  classificationFixture,
} from "./__fixtures__/classification";
import { detailCommonFixture } from "./__fixtures__/detail-common";
import { detailImageFixture } from "./__fixtures__/detail-image";
import { touristAttractionIntroFixture } from "./__fixtures__/detail-intro";
import { districtFixture, regionFixture } from "./__fixtures__/region";

const emptyResponse = {
  response: {
    header: { resultCode: "0000", resultMsg: "OK" },
    body: { items: "", numOfRows: 0, pageNo: 1, totalCount: 0 },
  },
};

export const getE2eTourApiFixture = (
  endpoint: string,
  params: Record<string, string | number> = {},
): unknown => {
  switch (endpoint) {
    case "areaBasedList2":
    case "searchKeyword2":
      return areaBasedListFixture;
    case "ldongCode2":
      return params.lDongRegnCd ? districtFixture : regionFixture;
    case "lclsSystmCode2":
      if (params.lclsSystm2) return classificationDepth3Fixture;
      if (params.lclsSystm1) return classificationDepth2Fixture;
      return classificationFixture;
    case "detailCommon2":
      return detailCommonFixture;
    case "detailImage2":
      return detailImageFixture;
    case "detailIntro2":
      return touristAttractionIntroFixture;
    case "detailInfo2":
      return emptyResponse;
    default:
      throw new Error(`No E2E TourAPI fixture for ${endpoint}`);
  }
};

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

const getExploreListFixture = (
  arrange: string | number | undefined,
  pageNo: string | number | undefined,
  numOfRows: string | number | undefined,
) => {
  const source = areaBasedListFixture.response.body.items.item[0];
  const allItems = Array.from({ length: 25 }, (_, index) => {
    const date = new Date(Date.UTC(2020 + index, index % 12, index + 1));
    const dateValue = date
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14);

    return {
      ...source,
      contentid: index === 0 ? source.contentid : `fixture-${index + 1}`,
      title: `Tour Fixture ${String(index + 1).padStart(2, "0")}`,
      createdtime: dateValue,
      modifiedtime: dateValue,
      firstimage: index % 4 === 3 ? "" : source.firstimage,
    };
  });

  const imageOnly = ["O", "Q", "R"].includes(String(arrange));
  const sortMode = String(arrange);
  const filtered = allItems.filter(
    (item) => !imageOnly || item.firstimage.trim() !== "",
  );

  if (["C", "Q"].includes(sortMode)) {
    filtered.sort((left, right) =>
      right.modifiedtime.localeCompare(left.modifiedtime),
    );
  } else if (["D", "R"].includes(sortMode)) {
    filtered.sort((left, right) =>
      right.createdtime.localeCompare(left.createdtime),
    );
  } else {
    filtered.sort((left, right) => left.title.localeCompare(right.title));
  }

  const page = Math.max(1, Number(pageNo) || 1);
  const pageSize = Math.max(1, Number(numOfRows) || 12);
  const start = (page - 1) * pageSize;

  return {
    response: {
      header: { resultCode: "0000", resultMsg: "OK" },
      body: {
        items: { item: filtered.slice(start, start + pageSize) },
        numOfRows: pageSize,
        pageNo: page,
        totalCount: filtered.length,
      },
    },
  };
};

export const getE2eTourApiFixture = (
  endpoint: string,
  params: Record<string, string | number> = {},
): unknown => {
  switch (endpoint) {
    case "areaBasedList2":
    case "searchKeyword2":
      return getExploreListFixture(
        params.arrange,
        params.pageNo,
        params.numOfRows,
      );
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

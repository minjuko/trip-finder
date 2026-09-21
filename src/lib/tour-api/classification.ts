import type { ClassificationOption } from "@/types/tour";

import { requestTourApi } from "./client";
import { createTourApiError } from "./errors";
import { normalizeClassificationResponse } from "./normalizers/classification";
import { classificationResponseSchema } from "./schemas/classification";

interface GetClassificationsParams {
  depth1Code?: string;
  depth2Code?: string;
  page?: number;
  pageSize?: number;
}

export const getClassifications = async ({
  depth1Code,
  depth2Code,
  page = 1,
  pageSize = 100,
}: GetClassificationsParams = {}): Promise<
  ClassificationOption[]
> => {
  const params: Record<string, string | number> = {
    pageNo: page,
    numOfRows: pageSize,
  };

  if (depth1Code) {
    params.lclsSystm1 = depth1Code;
  }

  if (depth2Code) {
    params.lclsSystm2 = depth2Code;
  }

  const rawData = await requestTourApi("lclsSystmCode2", {
    params,
  });

  const parsed = classificationResponseSchema.parse(rawData);
  const { header } = parsed.response;

  if (header.resultCode !== "0000") {
    throw createTourApiError(
      header.resultCode,
      header.resultMsg,
    );
  }

  return normalizeClassificationResponse(parsed);
};
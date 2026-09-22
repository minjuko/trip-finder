import { NextResponse } from "next/server";

import { getRegions } from "@/lib/tour-api/region";
import { regionOptionResponseSchema } from "@/lib/search/option-schemas";

interface DistrictRouteContext {
  params: Promise<{
    regionCode: string;
  }>;
}

export const GET = async (
  _request: Request,
  { params }: DistrictRouteContext,
) => {
  // 변경: Client Component가 TourAPI를 직접 호출하지 않도록
  // Next.js 서버 경계를 통해 시군구 목록 조회
  const { regionCode } = await params;

  const normalizedRegionCode = regionCode.trim();

  if (!normalizedRegionCode) {
    return NextResponse.json(
      {
        message: "regionCode is required",
      },
      {
        status: 400,
      },
    );
  }

  const districts = await getRegions({
    regionCode: normalizedRegionCode,
  });

  return NextResponse.json(
    regionOptionResponseSchema.parse(districts),
  );
};

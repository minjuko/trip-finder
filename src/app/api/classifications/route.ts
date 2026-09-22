import { NextRequest, NextResponse } from "next/server";

import { getClassificationOptions } from "@/lib/tour-api/classification";
import { classificationOptionResponseSchema } from "@/lib/search/option-schemas";

export const GET = async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;

  // 변경: 현재 선택된 상위 분류를 query parameter로 전달받음
  const depth1Code =
    searchParams.get("depth1")?.trim() || undefined;
  const depth2Code =
    searchParams.get("depth2")?.trim() || undefined;

  // 변경: 2단계 없이 3단계 조회를 요청하는 잘못된 조합 방지
  if (depth2Code && !depth1Code) {
    return NextResponse.json(
      {
        message:
          "depth2 requires depth1",
      },
      {
        status: 400,
      },
    );
  }

  const classifications =
    await getClassificationOptions({
      depth1Code,
      depth2Code,
    });

  return NextResponse.json(
    classificationOptionResponseSchema.parse(classifications),
  );
};

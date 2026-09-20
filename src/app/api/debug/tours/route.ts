import { NextResponse } from "next/server";

import { getAreaBasedList } from "@/lib/tour-api/area-based-list";

export const GET = async () => {
  const result = await getAreaBasedList({
    page: 1,
    pageSize: 3,
    contentTypeId: "12",
  });

  return NextResponse.json(result);
};
import { z } from "zod";

// 변경: 분류 3단계 상태를 각각 URL parameter로 관리
const exploreSearchParamsSchema = z.object({
  region: z.string().optional(),
  district: z.string().optional(),
  category1: z.string().optional(),
  category2: z.string().optional(),
  category3: z.string().optional(),
  keyword: z.string().optional(),
  page: z.string().optional(),
  view: z.string().optional(),
});

// 변경: URL parsing 이후 사용하는 Explore Query Model
export interface ExploreQuery {
  region: string | null;
  district: string | null;
  category1: string | null;
  category2: string | null;
  category3: string | null;
  keyword: string | null;
  page: number;
  view: "grid" | "list";
}

export type ExploreSearchParams = Record<
  string,
  string | string[] | undefined
>;

const getSingleValue = (
  value: string | string[] | undefined,
): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

const normalizeOptionalString = (
  value: string | undefined,
): string | null => {
  const normalized = value?.trim();

  return normalized ? normalized : null;
};

const normalizePage = (
  value: string | undefined,
): number => {
  if (!value) {
    return 1;
  }

  if (!/^\d+$/.test(value)) {
    return 1;
  }

  const page = Number(value);

  if (!Number.isSafeInteger(page) || page < 1) {
    return 1;
  }

  return page;
};

export const parseExploreQuery = (
  searchParams: ExploreSearchParams,
): ExploreQuery => {
  const candidate = {
    region: getSingleValue(searchParams.region),
    district: getSingleValue(searchParams.district),

    // 변경: 분류 depth별 URL 값 parsing
    category1: getSingleValue(searchParams.category1),
    category2: getSingleValue(searchParams.category2),
    category3: getSingleValue(searchParams.category3),

    keyword: getSingleValue(searchParams.keyword),
    page: getSingleValue(searchParams.page),
    view: getSingleValue(searchParams.view),
  };

  const parsed = exploreSearchParamsSchema.parse(candidate);

  const region = normalizeOptionalString(parsed.region);

  // 변경: 상위 분류가 없으면 하위 분류 상태를 제거
  const category1 = normalizeOptionalString(parsed.category1);

  const category2 = category1
    ? normalizeOptionalString(parsed.category2)
    : null;

  const category3 =
    category1 && category2
      ? normalizeOptionalString(parsed.category3)
      : null;

  return {
    region,
    district: region
      ? normalizeOptionalString(parsed.district)
      : null,
    category1,
    category2,
    category3,
    keyword: normalizeOptionalString(parsed.keyword),
    page: normalizePage(parsed.page),
    view: parsed.view === "list" ? "list" : "grid",
  };
};

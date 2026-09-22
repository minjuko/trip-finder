import type { MetadataRoute } from "next";

import { getAreaBasedList } from "@/lib/tour-api/area-based-list";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://trip-finder-mauve.vercel.app";

  let contents: Awaited<ReturnType<typeof getAreaBasedList>>["items"] = [];

  try {
    const result = await getAreaBasedList({
      page: 1,
      pageSize: 100,
    });
    contents = result.items;
  } catch {
    // TourAPI가 일시적으로 unavailable해도 기본 사이트맵은 유지한다.
  }

  return [
    {
      url: baseUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...contents.map((content) => ({
      url: `${baseUrl}/places/${content.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}

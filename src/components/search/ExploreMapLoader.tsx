"use client";

import dynamic from "next/dynamic";

import type { TourContent } from "@/types/tour";

const ExploreMap = dynamic(
  () => import("./ExploreMap").then((module) => module.ExploreMap),
  { ssr: false },
);

export const ExploreMapLoader = ({ contents }: { contents: TourContent[] }) => (
  <ExploreMap contents={contents} />
);

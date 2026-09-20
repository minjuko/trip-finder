import "server-only";

import { env } from "@/lib/env";

import { TourApiError } from "./errors";

const TOUR_API_BASE_URL =
  "https://apis.data.go.kr/B551011/KorService2";

const DEFAULT_TIMEOUT_MS = 10_000;

interface TourApiRequestOptions {
  params?: Record<string, string | number>;
  signal?: AbortSignal;
}

export const requestTourApi = async (
  endpoint: string,
  options: TourApiRequestOptions = {},
): Promise<unknown> => {
  const url = new URL(`${TOUR_API_BASE_URL}/${endpoint}`);

  url.searchParams.set("serviceKey", env.TOUR_API_SERVICE_KEY);
  url.searchParams.set("MobileOS", "ETC");
  url.searchParams.set("MobileApp", "TripFinder");
  url.searchParams.set("_type", "json");

  for (const [key, value] of Object.entries(options.params ?? {})) {
    url.searchParams.set(key, String(value));
  }
/* 오류 해결용 콘솔*/
console.log({
  origin: url.origin,
  pathname: url.pathname,
  pageNo: url.searchParams.get("pageNo"),
  numOfRows: url.searchParams.get("numOfRows"),
  contentTypeId: url.searchParams.get("contentTypeId"),
  hasServiceKey: Boolean(url.searchParams.get("serviceKey")),
});

  const timeoutSignal = AbortSignal.timeout(DEFAULT_TIMEOUT_MS);

  const signal = options.signal
    ? AbortSignal.any([options.signal, timeoutSignal])
    : timeoutSignal;

  let response: Response;

  try {
    response = await fetch(url, {
      signal,
    });
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === "TimeoutError"
    ) {
      throw new TourApiError(
        "TIMEOUT",
        "TourAPI request timed out",
      );
    }

    throw new TourApiError(
      "UNKNOWN",
      "Failed to request TourAPI",
    );
  }

  if (!response.ok) {
    throw new TourApiError(
      "SERVER_ERROR",
      `TourAPI HTTP request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<unknown>;
};
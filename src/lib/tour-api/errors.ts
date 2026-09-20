export type TourApiErrorType =
  | "INVALID_REQUEST"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "SERVER_ERROR"
  | "UNKNOWN";

export class TourApiError extends Error {
  constructor(
    public readonly type: TourApiErrorType,
    message: string,
    public readonly resultCode?: string,
  ) {
    super(message);
    this.name = "TourApiError";
  }
}

const RESULT_CODE_TO_ERROR_TYPE: Record<string, TourApiErrorType> = {
  "01": "SERVER_ERROR",
  "04": "SERVER_ERROR",
  "05": "TIMEOUT",
  "10": "INVALID_REQUEST",
  "20": "UNAUTHORIZED",
  "22": "RATE_LIMITED",
  "23": "RATE_LIMITED",
  "30": "UNAUTHORIZED",
  "31": "UNAUTHORIZED",
};

export const createTourApiError = (
  resultCode: string,
  resultMessage: string,
): TourApiError => {
  const type = RESULT_CODE_TO_ERROR_TYPE[resultCode] ?? "UNKNOWN";

  return new TourApiError(type, resultMessage, resultCode);
};
export const ApiStatus = {
  Success: 0, ServerError: 1, BadRequest: 2, NotFound: 3, ListEmpty: 4,
  LogicError: 5, UnAuthorized: 6, NoContent: 7, Forbidden: 8, Conflict: 9,
  UnprocessableEntity: 10, TooManyRequests: 11, CaptchaInvalid: 12,
  InvalidCredentials: 13, InvalidOtp: 14,
} as const;

export type ApiErrorKind = "validation" | "unauthorized" | "forbidden" | "not-found" | "conflict" | "rate-limit" | "server" | "network" | "unknown";

export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;
  constructor(status: number, message = "", kind?: ApiErrorKind) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.kind = kind ?? classify(status);
  }
}

function classify(status: number): ApiErrorKind {
  if (status === 400 || status === 2 || status === 10 || status === 12 || status === 13 || status === 14) return "validation";
  if (status === 401 || status === 6) return "unauthorized";
  if (status === 403 || status === 8) return "forbidden";
  if (status === 404 || status === 3) return "not-found";
  if (status === 409 || status === 9) return "conflict";
  if (status === 429 || status === 11) return "rate-limit";
  if (status >= 500 || status === 1 || status === 502) return "server";
  return "unknown";
}

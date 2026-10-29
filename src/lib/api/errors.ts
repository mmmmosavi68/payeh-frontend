/** کدهای وضعیت ApiResult بک‌اند (ApiResultStatusCode). */
export const ApiStatus = {
  Success: 0,
  ServerError: 1,
  BadRequest: 2,
  NotFound: 3,
  ListEmpty: 4,
  LogicError: 5,
  UnAuthorized: 6,
  NoContent: 7,
  Forbidden: 8,
  Conflict: 9,
  UnprocessableEntity: 10,
  TooManyRequests: 11,
  CaptchaInvalid: 12,
  InvalidCredentials: 13,
  InvalidOtp: 14,
} as const;

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message = "") {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

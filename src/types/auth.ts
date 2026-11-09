export type AuthConfig = {
  captchaEnabled: boolean;
  captchaProvider: string | null;
  mobileLoginEnabled: boolean;
  passwordLoginEnabled: boolean;
  passwordLoginRequiresOtp: boolean;
  otpLength: number;
};

export type CaptchaImage = {
  captchaId: string;
  imageBase64: string;
  contentType: string;
  expiresInSeconds: number;
};

export type OtpRequestResult = {
  devCode?: string | null;
  expiresInSeconds: number;
  resendAfterSeconds: number;
};

export type LoginChallenge = {
  challengeId: string;
  maskedMobile: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
  devCode?: string | null;
};

export type PasswordLoginResult =
  | { requiresOtp: true; challenge: LoginChallenge }
  | { requiresOtp: false };

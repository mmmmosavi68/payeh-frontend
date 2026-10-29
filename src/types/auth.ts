export type AuthConfig = {
  captchaEnabled: boolean;
  captchaSiteKey: string | null;
  mobileLoginEnabled: boolean;
  passwordLoginEnabled: boolean;
  passwordLoginRequiresOtp: boolean;
  otpLength: number;
};

export type OtpRequestResult = {
  expiresInSeconds: number;
  resendAfterSeconds: number;
};

export type LoginChallenge = {
  challengeId: string;
  maskedMobile: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
};

export type PasswordLoginResult = { requiresOtp: true; challenge: LoginChallenge } | { requiresOtp: false };

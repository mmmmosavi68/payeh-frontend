export class MockAuthError extends Error {
  readonly code: "invalid_credentials" | "invalid_otp";

  constructor(code: "invalid_credentials" | "invalid_otp") {
    super(code);
    this.code = code;
  }
}

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function mockSignIn(input: {
  username: string;
  password: string;
}): Promise<{ step: "otp"; phone: string }> {
  await delay(700);
  if (input.password === "wrong") {
    throw new MockAuthError("invalid_credentials");
  }
  return { step: "otp", phone: "0912•••4567" };
}

export async function mockVerifyOtp(code: string): Promise<{ ok: true }> {
  await delay(600);
  if (code !== "123456") {
    throw new MockAuthError("invalid_otp");
  }
  return { ok: true };
}

export async function mockResendOtp(): Promise<void> {
  await delay(400);
}
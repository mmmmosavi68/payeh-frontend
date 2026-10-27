export const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export class MockApiError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
  }
}
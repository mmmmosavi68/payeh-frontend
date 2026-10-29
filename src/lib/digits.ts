/** Converts Persian/Arabic-Indic digits to Latin digits. */
export function toLatinDigits(value: string): string {
  return value.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0)).replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

/** Normalizes an Iranian mobile number to 09xxxxxxxxx. */
export function normalizeMobile(value: string): string {
  let mobile = toLatinDigits(value).trim().replace(/[\s-]/g, "");
  if (mobile.startsWith("+98")) mobile = "0" + mobile.slice(3);
  else if (mobile.startsWith("0098")) mobile = "0" + mobile.slice(4);
  else if (mobile.startsWith("98") && mobile.length === 12) mobile = "0" + mobile.slice(2);
  else if (mobile.startsWith("9") && mobile.length === 10) mobile = "0" + mobile;
  return mobile;
}

/** 09123456789 -> 0912•••6789 */
export function maskMobile(value: string): string {
  const mobile = normalizeMobile(value);
  return mobile.length >= 8 ? `${mobile.slice(0, 4)}•••${mobile.slice(-4)}` : "••••";
}

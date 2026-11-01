/**
 * تاریخ‌های API در UTC هستند ولی ممکن است بدون پسوند Z برسند (EF Core).
 * بدون این اصلاح، مرورگر آن را به وقت محلی می‌خواند و ساعت‌ها جابه‌جا می‌شود.
 */
export function parseApiDate(value: string): Date {
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(value);
  return new Date(hasZone ? value : `${value}Z`);
}

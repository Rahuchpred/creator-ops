const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const whole = new Intl.NumberFormat("en-US");

const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const cents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 0,
});

const decimal = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

const day = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const month = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export const formatCompact = (value: number) => compact.format(value);
export const formatNumber = (value: number) => whole.format(value);
export const formatDollars = (value: number) => dollars.format(value);
export const formatMoney = (value: number) => cents.format(value);
// Whole dollars stay whole, anything else shows its cents.
export const formatAmount = (value: number) =>
  Number.isInteger(value) ? dollars.format(value) : cents.format(value);
// Takes a share from 0 to 1.
export const formatPercent = (value: number) => percent.format(value);
export const formatDecimal = (value: number) => decimal.format(value);
export const formatDay = (iso: string) => day.format(new Date(`${iso}T00:00:00Z`));

// Takes a month as "2026-10".
export const formatMonth = (iso: string) => month.format(new Date(`${iso}-01T00:00:00Z`));

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

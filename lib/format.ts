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

const day = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export const formatCompact = (value: number) => compact.format(value);
export const formatNumber = (value: number) => whole.format(value);
export const formatDollars = (value: number) => dollars.format(value);
export const formatMoney = (value: number) => cents.format(value);
export const formatDay = (iso: string) => day.format(new Date(`${iso}T00:00:00Z`));

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

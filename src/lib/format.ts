export const inr = (n: number) =>
  "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(n || 0));

export const inr2 = (n: number) =>
  "₹" + new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

export const fmtDate = (d: string | Date) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const today = () => new Date().toISOString().slice(0, 10);
export const addDays = (d: string, days: number) => {
  const date = new Date(d);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};
export const daysBetween = (a: string, b: string) =>
  Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

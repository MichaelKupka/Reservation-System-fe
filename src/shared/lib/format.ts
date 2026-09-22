export const money = (amount: number, currency = "EUR") =>
  new Intl.NumberFormat("sk-SK", { style: "currency", currency }).format(
    amount / 100,
  );
export const time = (date: string) =>
  new Intl.DateTimeFormat("sk-SK", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
export const dateLabel = (date: string) =>
  new Intl.DateTimeFormat("sk-SK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
export function dayKey(value: string | Date) {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export const localInput = (value: string) => {
  const d = new Date(value);
  return `${dayKey(d)}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
export const stateLabel: Record<string, string> = {
  HELD: "Čaká na úhradu",
  CONFIRMED: "Zaplatené",
  CANCELLED: "Zrušené",
  EXPIRED: "Čas vypršal",
  DRAFT: "Návrh",
  PUBLISHED: "V predaji",
  FINISHED: "Odpremietané",
  VALID: "Platná",
  USED: "Použitá",
  VOID: "Neplatná",
  SUCCEEDED: "Úspešná",
  FAILED: "Neúspešná",
  PENDING: "Pripravuje sa",
  DELIVERED: "Spracované",
};
export function remaining(expires: string, now = Date.now()) {
  const seconds = Math.max(
    0,
    Math.floor((new Date(expires).getTime() - now) / 1000),
  );
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
export function safeNext(value: string | null) {
  return value?.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !value.startsWith("/prihlasenie")
    ? value
    : "/";
}

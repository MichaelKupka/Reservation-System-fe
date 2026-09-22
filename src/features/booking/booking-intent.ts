export interface BookingIntent {
  key: string;
  fingerprint: string;
}
export function resolveIntent(
  current: BookingIntent | null,
  ids: string[],
  createKey: () => string,
): BookingIntent {
  const fingerprint = [...ids].sort().join(",");
  return current?.fingerprint === fingerprint
    ? current
    : { key: createKey(), fingerprint };
}
export function readIntent(storageKey: string): BookingIntent | null {
  try {
    const data = JSON.parse(sessionStorage.getItem(storageKey) || "null");
    return data &&
      typeof data.key === "string" &&
      typeof data.fingerprint === "string"
      ? data
      : null;
  } catch {
    return null;
  }
}
export function saveIntent(storageKey: string, intent: BookingIntent | null) {
  try {
    if (intent) sessionStorage.setItem(storageKey, JSON.stringify(intent));
    else sessionStorage.removeItem(storageKey);
  } catch {
    /* Memory retains the current request if browser storage is unavailable. */
  }
}

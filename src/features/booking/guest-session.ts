interface GuestGrant {
  token: string;
  expires_at: string;
}
type GuestStore = Record<string, GuestGrant>;
const STORAGE_KEY = "kino.guest";
const memory: GuestStore = {};

function readStore(): GuestStore {
  try {
    const data = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
    if (data && typeof data === "object") return { ...memory, ...data };
  } catch {
    /* Storage may be unavailable; the memory mirror keeps this tab working. */
  }
  return { ...memory };
}
function writeStore(store: GuestStore) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* Memory retains the grant when browser storage is unavailable. */
  }
}
export function saveGuestToken(
  reservationId: string,
  token: string,
  expiresAt: string,
) {
  memory[reservationId] = { token, expires_at: expiresAt };
  const store = readStore();
  store[reservationId] = memory[reservationId];
  writeStore(store);
}
export function readGuestToken(reservationId: string): string | null {
  const grant = readStore()[reservationId];
  if (!grant) return null;
  if (new Date(grant.expires_at).getTime() <= Date.now()) {
    clearGuestToken(reservationId);
    return null;
  }
  return grant.token;
}
export function clearGuestToken(reservationId: string) {
  delete memory[reservationId];
  const store = readStore();
  if (reservationId in store) {
    delete store[reservationId];
    writeStore(store);
  }
}

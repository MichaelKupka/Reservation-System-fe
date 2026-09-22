import type { Page } from "./types";

const BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const SESSION_KEY = "kino.session";
let token: string | null = null;
try {
  token = sessionStorage.getItem(SESSION_KEY);
} catch {
  /* Storage may be unavailable in private contexts. */
}
export const getToken = () => token;
export function setToken(value: string | null) {
  token = value;
  try {
    if (value) sessionStorage.setItem(SESSION_KEY, value);
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* The current session can continue in memory. */
  }
}

const messages: Record<string, string> = {
  invalid_credentials: "E-mail alebo heslo nie je správne.",
  authentication_required: "Prihlásenie vypršalo. Prihláste sa znova.",
  email_taken: "Účet s týmto e-mailom už existuje.",
  too_many_attempts: "Príliš veľa pokusov. Skúste sa prihlásiť o 15 minút.",
  forbidden: "Na túto akciu nemáte oprávnenie.",
  validation_error: "Skontrolujte vyplnené údaje a skúste to znova.",
  seat_unavailable:
    "Niekto si práve vybral rovnaké miesto. Dostupnosť sme obnovili, vyberte si iné.",
  sales_closed: "Predaj na toto premietanie sa už skončil.",
  screening_unavailable: "Na toto premietanie sa už nedá rezervovať.",
  reservation_expired: "Čas rezervácie vypršal. Vyberte si miesta znova.",
  resource_not_found: "Rezervácia alebo miesto sa nenašlo.",
  not_found: "Požadovaný záznam sa nenašiel.",
  idempotency_conflict: "Táto požiadavka už bola použitá pre iný výber miest.",
  cancellation_not_allowed: "Zaplatenú rezerváciu nie je možné zrušiť.",
  invalid_state: "Túto akciu už aktuálny stav nepovoľuje.",
  service_unavailable: "Služba je dočasne nedostupná. Skúste to o chvíľu.",
  ticket_unavailable: "Táto vstupenka už bola použitá alebo zneplatnená.",
  ticket_not_found: "Vstupenka s týmto kódom sa nenašla.",
  admission_closed:
    "Vstup je možný od 30 minút pred začiatkom do konca premietania.",
  screening_overlap: "V tomto čase už je v sále naplánované iné premietanie.",
  screening_immutable: "Upravovať možno iba návrh premietania.",
  published_movie_immutable:
    "Údaje filmu použitého v programe už nemožno meniť. Možno ho deaktivovať.",
  last_admin: "Musí zostať aspoň jeden aktívny administrátor.",
  auditorium_name_conflict: "Sála s týmto názvom už existuje.",
  invalid_schedule: "Čas premietania alebo ukončenia predaja nie je platný.",
  payment_not_found: "Pre túto rezerváciu ešte nie je zaznamenaná platba.",
};
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(
      messages[code] || "Operáciu sa nepodarilo dokončiť. Skúste to znova.",
    );
  }
}
export function errorText(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return "Nepodarilo sa pripojiť. Skontrolujte pripojenie a skúste to znova.";
}
export async function api<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    signal?: AbortSignal;
    key?: string;
    token?: string | null;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const sentToken = options.token === undefined ? token : options.token;
  if (sentToken) headers.Authorization = `Bearer ${sentToken}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.key) headers["Idempotency-Key"] = options.key;
  const response = await fetch(`${BASE}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal
      ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)])
      : AbortSignal.timeout(15000),
    cache: "no-store",
    credentials: "omit",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (
      response.status === 401 &&
      path !== "/auth/login" &&
      options.token === undefined &&
      sentToken &&
      token === sentToken
    ) {
      setToken(null);
      window.dispatchEvent(new Event("kino:unauthorized"));
    }
    throw new ApiError(response.status, body.code || "service_unavailable");
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
export async function allPages<T>(
  path: string,
  signal?: AbortSignal,
  options: { token?: string | null } = {},
): Promise<T[]> {
  const result: T[] = [];
  for (let offset = 0; ; offset += 100) {
    const response = await api<Page<T> | T[]>(
      `${path}${path.includes("?") ? "&" : "?"}limit=100&offset=${offset}`,
      { ...options, signal },
    );
    const items = Array.isArray(response) ? response : response.items;
    result.push(...items);
    if (items.length < 100) return result;
  }
}

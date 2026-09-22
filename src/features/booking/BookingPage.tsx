import { ArrowLeft, ArrowRight, Info, RefreshCw, X } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiError, api } from "../../shared/api/client";
import type {
  Availability,
  GuestReservation,
  Reservation,
  Screening,
} from "../../shared/api/types";
import { money } from "../../shared/lib/format";
import { useAsync, useNow } from "../../shared/lib/hooks";
import {
  ErrorState,
  InlineError,
  Loading,
  Modal,
  Submit,
} from "../../shared/ui/index";
import { useAuth } from "../auth/auth-context";
import { readIntent, resolveIntent, saveIntent } from "./booking-intent";
import { saveGuestToken } from "./guest-session";

import {
  BookingStepper,
  FilmBackdrop,
  FilmContext,
  ScreeningDetails,
} from "./BookingFlow";
import { SeatPicker } from "./SeatPicker";

export default function Booking() {
  const { id } = useParams();
  const { user, loading: authLoading, error: authError, refresh } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const now = useNow();
  const data = useAsync(
    async (signal) => {
      const [screening, availability] = await Promise.all([
        api<Screening>(`/screenings/${id}`, { signal }),
        api<Availability>(`/screenings/${id}/seats`, { signal }),
      ]);
      return { screening, availability };
    },
    [id],
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [guestOpen, setGuestOpen] = useState(false);
  const storageKey = `kino.booking.${user?.id || "anon"}.${id}`;
  const intent = useRef(readIntent(storageKey));
  const activeKey = useRef<string | null>(storageKey);
  activeKey.current = storageKey;
  useEffect(() => {
    activeKey.current = storageKey;
    return () => {
      activeKey.current = null;
    };
  }, [storageKey]);
  useEffect(() => {
    setBusy(false);
    setError(undefined);
    intent.current = readIntent(storageKey);
    setSelected(intent.current?.fingerprint.split(",").filter(Boolean) || []);
  }, [storageKey]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setInterval(() => {
      if (document.hidden || busy) return;
      api<Availability>(`/screenings/${id}/seats`, {
        signal: controller.signal,
      })
        .then((availability) =>
          data.setValue((current) =>
            current && current.screening.id === id && !controller.signal.aborted
              ? { ...current, availability }
              : current,
          ),
        )
        .catch(() => {});
    }, 10_000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [id, busy, data.setValue]);
  if (data.loading) return <Loading label="Hľadáme vaše miesto…" />;
  if (data.error || !data.value)
    return (
      <div className="container">
        <ErrorState error={data.error} retry={data.reload} />
      </div>
    );
  const { screening, availability } = data.value;
  const seats = availability.seats;
  const chosen = seats.filter((seat) => selected.includes(seat.id));
  const total = chosen.reduce((sum, seat) => sum + seat.price_minor, 0);
  const closed =
    !availability.sales_open ||
    new Date(availability.sales_close_at).getTime() <= now;
  function toggle(seat: string) {
    setError(undefined);
    setSelected((current) =>
      current.includes(seat)
        ? current.filter((s) => s !== seat)
        : current.length < 6
          ? [...current, seat]
          : current,
    );
  }
  function reserve() {
    if (!user) {
      setError(undefined);
      setGuestOpen(true);
      return;
    }
    void performReserve();
  }
  function submitGuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void performReserve({
      email: String(form.get("email")),
      full_name: String(form.get("full_name")),
    });
  }
  async function performReserve(guest?: { email: string; full_name: string }) {
    if (busy || authLoading || authError || !selected.length || closed) return;
    const requestKey = storageKey;
    setBusy(true);
    setError(undefined);
    intent.current = resolveIntent(intent.current, selected, () =>
      crypto.randomUUID(),
    );
    saveIntent(storageKey, intent.current);
    try {
      let reservation: Reservation;
      if (guest) {
        const grant = await api<GuestReservation>("/guest/reservations", {
          method: "POST",
          body: { ...guest, screening_seat_ids: selected },
          key: intent.current.key,
          token: null,
        });
        saveGuestToken(
          grant.reservation.id,
          grant.guest_token,
          grant.guest_token_expires_at,
        );
        reservation = grant.reservation;
      } else {
        reservation = await api<Reservation>("/reservations", {
          method: "POST",
          body: { screening_seat_ids: selected },
          key: intent.current.key,
        });
      }
      saveIntent(requestKey, null);
      if (activeKey.current !== requestKey) return;
      intent.current = null;
      if (
        reservation.state === "EXPIRED" ||
        reservation.state === "CANCELLED"
      ) {
        setError(
          "Pôvodná rezervácia už skončila. Novým kliknutím vytvoríte novú rezerváciu.",
        );
        return;
      }
      setGuestOpen(false);
      navigate(`/rezervacie/${reservation.id}`);
    } catch (e) {
      if (activeKey.current !== requestKey) return;
      setError(e);
      if (e instanceof ApiError && e.status >= 400 && e.status < 500) {
        saveIntent(storageKey, null);
        intent.current = null;
        try {
          const fresh = await api<Availability>(`/screenings/${id}/seats`);
          if (activeKey.current !== requestKey) return;
          data.setValue({ screening, availability: fresh });
          setSelected((current) =>
            current.filter((s) =>
              fresh.seats.some((seat) => seat.id === s && seat.available),
            ),
          );
        } catch {}
      }
    } finally {
      if (activeKey.current === requestKey) setBusy(false);
    }
  }
  return (
    <div className="booking-page cinema-flow relative">
      <FilmBackdrop title={screening.movie_title} />
      <div className="container">
        <Link className="back-link" to="/">
          <ArrowLeft size={16} />
          Späť na program
        </Link>
        <header className="booking-top flex flex-col justify-end">
          <p className="eyebrow">TERAZ NA VEĽKOM PLÁTNE</p>
          <h1>{screening.movie_title}</h1>
          <p>Vyberte si miesto. O zvyšok zážitku sa postará plátno.</p>
        </header>
        <div className="booking-layout items-start gap-y-0 gap-x-8 grid">
          <FilmContext screening={screening} />
          <div className="booking-task min-w-0">
            <BookingStepper step={1} />
            <div className="auditorium-layout grid items-start">
              <section className="seat-panel" aria-label="Výber sedadiel">
                <div className="seat-panel-heading">
                  <div>
                    <h2>Vyberte si miesta</h2>
                    <span className="muted small">
                      Vyberte si najviac 6 miest.
                    </span>
                  </div>
                  <button
                    className="icon-button"
                    aria-label="Obnoviť dostupnosť"
                    onClick={data.reload}
                    disabled={busy}
                  >
                    <RefreshCw size={17} />
                  </button>
                </div>
                {selected.length === 6 && (
                  <div className="notice">
                    <Info size={16} />
                    <span>
                      Máte vybraných 6 miest. Pre iný výber najskôr jedno
                      odznačte.
                    </span>
                  </div>
                )}
                {closed && (
                  <InlineError error="Predaj na toto premietanie sa už skončil." />
                )}
                {!closed &&
                  seats.length > 0 &&
                  !seats.some((seat) => seat.available) &&
                  selected.length === 0 && (
                    <div className="notice">
                      Toto premietanie je vypredané. Môžete sa vrátiť na program
                      a vybrať iný termín.
                    </div>
                  )}
                <SeatPicker
                  seats={seats}
                  selected={selected}
                  busy={busy}
                  closed={closed}
                  toggle={toggle}
                />
                <p className="seat-help">
                  <Info size={15} />
                  Miesta vám podržíme až po potvrdení výberu.
                </p>
              </section>
              <ScreeningDetails screening={screening} />
            </div>
          </div>
          <aside className="booking-summary">
            <div className="chosen-seats flex-col gap-3 flex">
              <span className="small muted" role="status" aria-live="polite">
                Vaše miesta · {chosen.length} vybraných
              </span>
              <div>
                {chosen.length ? (
                  chosen.map((seat) => (
                    <button
                      className="seat-chip"
                      key={seat.id}
                      disabled={busy}
                      aria-label={`Odstrániť miesto ${seat.seat_label}`}
                      onClick={() => {
                        document
                          .querySelector<HTMLButtonElement>(
                            `[data-seat-id="${seat.id}"]`,
                          )
                          ?.focus();
                        toggle(seat.id);
                      }}
                    >
                      <span className="chosen-seat-label">
                        <strong>{seat.row_number}</strong> rad{" "}
                        <strong>{seat.seat_number}</strong> miesto
                      </span>
                      <span className="chosen-seat-price">
                        {money(seat.price_minor)}
                      </span>
                      <X size={14} />
                    </button>
                  ))
                ) : (
                  <span className="muted">Zatiaľ ste si nevybrali</span>
                )}
              </div>
            </div>
            <div className="booking-action">
              <div className="price-total justify-between items-center gap-3 text-[14px] flex">
                <span>
                  Spolu{" "}
                  <small>
                    {chosen.length} {chosen.length === 1 ? "miesto" : "miest"}
                  </small>
                </span>
                <strong>{money(total)}</strong>
              </div>
              <button
                className="btn primary full"
                onClick={reserve}
                disabled={
                  !selected.length ||
                  busy ||
                  closed ||
                  authLoading ||
                  !!authError
                }
              >
                {busy
                  ? "Držíme vám miesta…"
                  : user
                    ? "Potvrdiť výber"
                    : "Rezervovať ako hosť"}
                <ArrowRight size={18} />
              </button>
            </div>
            <InlineError error={error} />
            {authError ? (
              <ErrorState error={authError} retry={() => void refresh()} />
            ) : null}
            {!user && (
              <p className="summary-note text-cinema-muted text-left text-[12px]">
                Účet nepotrebujete. Miesta vám podržíme po zadaní kontaktu.{" "}
                <Link
                  className="text-button"
                  to={`/prihlasenie?next=${encodeURIComponent(location.pathname + location.search)}`}
                >
                  Máte účet? Prihláste sa
                </Link>
              </p>
            )}
            <p className="summary-note text-cinema-muted text-left text-[12px]">
              Na dokončenie nákupu budete mať najviac 10 minút.
            </p>
          </aside>
        </div>
      </div>
      {guestOpen && (
        <Modal
          title="Rezervácia bez účtu"
          onClose={() => !busy && setGuestOpen(false)}
        >
          <p className="muted">
            Zadajte kontakt k rezervácii. Účet si vytvárať nemusíte a miesta vám
            podržíme hneď po potvrdení.
          </p>
          <form onSubmit={submitGuest} className="form-stack">
            <InlineError error={error} />
            <label>
              Vaše meno
              <input
                name="full_name"
                autoComplete="name"
                minLength={2}
                maxLength={120}
                required
                placeholder="Meno a priezvisko"
              />
            </label>
            <label>
              E-mail
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="vas@email.sk"
              />
            </label>
            <div className="form-actions">
              <button
                type="button"
                className="btn secondary"
                onClick={() => setGuestOpen(false)}
                disabled={busy}
              >
                Späť
              </button>
              <Submit busy={busy}>
                Podržať miesta <ArrowRight size={18} />
              </Submit>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

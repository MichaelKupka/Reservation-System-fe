import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Info,
  Ticket,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../shared/api/client";
import { readGuestToken } from "./guest-session";
import type {
  Ticket as Admission,
  Checkout as CheckoutResponse,
  Reservation,
  Screening,
} from "../../shared/api/types";
import { dateLabel, money, remaining, time } from "../../shared/lib/format";
import { useAsync, useNow } from "../../shared/lib/hooks";
import { venueLabel } from "../../shared/lib/venue";
import {
  Badge,
  ErrorState,
  InlineError,
  Loading,
  Modal,
} from "../../shared/ui/index";
import { BookingStepper, FilmBackdrop, FilmContext } from "./BookingFlow";
import { TicketCard } from "./TicketCard";

function OrderSummary({ reservation }: { reservation: Reservation }) {
  return (
    <div className="checkout-order">
      <div className="order-lines flex-col gap-3 flex">
        {[...reservation.items]
          .sort((a, b) =>
            a.seat_label.localeCompare(b.seat_label, "sk", { numeric: true }),
          )
          .map((item) => (
            <div key={item.screening_seat_id}>
              <span>
                Miesto <strong>{item.seat_label}</strong>
              </span>
              <span>{money(item.unit_price_minor)}</span>
            </div>
          ))}
      </div>
      <div className="price-total justify-between items-center gap-3 text-[14px] flex">
        <span>Spolu</span>
        <strong>{money(reservation.total_minor)}</strong>
      </div>
    </div>
  );
}

export default function Checkout() {
  const { id } = useParams();
  const guestToken = useMemo(() => (id ? readGuestToken(id) : null), [id]);
  const guest = !!guestToken;
  const authOptions = useMemo(
    () => (guestToken ? { token: guestToken } : {}),
    [guestToken],
  );
  const visitsPath = guest ? "/" : "/navstevy";
  const now = useNow();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const data = useAsync(
    async (signal) => {
      const [reservation, schema, tickets] = await Promise.all([
        api<Reservation>(`/reservations/${id}`, { signal, ...authOptions }),
        api<{ paths: Record<string, unknown> }>("/openapi.json", { signal }),
        api<Admission[]>(`/reservations/${id}/tickets`, {
          signal,
          ...authOptions,
        }),
      ]);
      const screening = await api<Screening>(
        `/screenings/${reservation.screening_id}`,
        { signal },
      ).catch(() => null);
      return {
        reservation,
        screening,
        tickets,
        demo: "/reservations/{reservation_id}/demo-payment" in schema.paths,
      };
    },
    [id],
  );
  const state = data.value?.reservation.state;
  useEffect(() => {
    if (state !== "HELD" || busy) return;
    const controller = new AbortController();
    const timer = setInterval(() => {
      api<Reservation>(`/reservations/${id}`, {
        signal: controller.signal,
        ...authOptions,
      })
        .then((reservation) =>
          data.setValue((current) =>
            current ? { ...current, reservation } : current,
          ),
        )
        .catch(() => {});
    }, 5000);
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, [id, state, busy, data.setValue, authOptions]);
  if (data.loading) return <Loading />;
  if (data.error || !data.value)
    return (
      <div className="container">
        <ErrorState error={data.error} retry={data.reload} />
      </div>
    );
  const { reservation, screening, tickets, demo } = data.value;
  const expired =
    reservation.state === "EXPIRED" ||
    (reservation.state === "HELD" &&
      new Date(reservation.expires_at).getTime() <= now);
  const confirmed = reservation.state === "CONFIRMED";
  const terminal = expired || reservation.state === "CANCELLED";
  async function pay(outcome: "SUCCEEDED" | "FAILED") {
    if (busy) return;
    setBusy(true);
    setError(undefined);
    setFailed(false);
    try {
      const checkout = await api<CheckoutResponse>(
        `/reservations/${id}/demo-payment`,
        { method: "POST", body: { outcome }, ...authOptions },
      );
      data.setValue((current) =>
        current
          ? {
              ...current,
              reservation: checkout.reservation,
              tickets: checkout.tickets,
            }
          : current,
      );
      setFailed(checkout.payment.status === "FAILED");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  async function cancel() {
    setBusy(true);
    setError(undefined);
    try {
      const cancelled = await api<Reservation>(`/reservations/${id}/cancel`, {
        method: "POST",
        ...authOptions,
      });
      data.setValue((current) =>
        current ? { ...current, reservation: cancelled } : current,
      );
      setCancelOpen(false);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="checkout-page cinema-flow relative">
      <FilmBackdrop title={screening?.movie_title} />
      <div className="container">
        <Link className="back-link" to={visitsPath}>
          <ArrowLeft size={16} />
          {guest ? "Späť na program" : "Moje návštevy"}
        </Link>
        <header className="booking-top flex flex-col justify-end">
          <p className="eyebrow">VÁŠ FILMOVÝ VEČER</p>
          <h1>{screening?.movie_title || "Filmové premietanie"}</h1>
        </header>
        <div className="checkout-grid grid items-start">
          <aside className="checkout-sidebar">
            {screening && <FilmContext screening={screening} />}
            <div className="sidebar-order">
              <OrderSummary reservation={reservation} />
            </div>
          </aside>
          <div className="checkout-task min-w-0">
            <div className="checkout-progress">
              <BookingStepper step={confirmed ? 3 : 2} />
            </div>
            <div className="checkout-heading text-left flex-col items-start gap-[13px] flex">
              <div
                className={`checkout-symbol text-cinema-muted grid ${confirmed ? "confirmed" : ""}`}
              >
                {confirmed ? (
                  <CheckCircle2 size={32} />
                ) : terminal ? (
                  <Clock3 size={32} />
                ) : (
                  <Ticket size={32} />
                )}
              </div>
              <p className="eyebrow">
                {confirmed
                  ? "TAK TEDA, VIDÍME SA V KINE"
                  : terminal
                    ? "PRÍBEH EŠTE NEKONČÍ"
                    : "UŽ LEN MALÝ KROK"}
              </p>
              <h2>
                {confirmed
                  ? "Máte svoje miesto."
                  : terminal
                    ? "Táto rezervácia už skončila."
                    : "Váš filmový večer čaká."}
              </h2>
              <p className="muted">
                {confirmed
                  ? "Vstupenky sú pripravené. Pri vstupe ich stačí ukázať personálu."
                  : terminal
                    ? "Miesta sme uvoľnili. Vyberte si nový termín alebo rezervujte znova."
                    : "Dokončite nákup skôr, než sa vaše miesta vrátia do predaja."}
              </p>
            </div>
            {confirmed ? (
              <div className="confirmation-layout items-start gap-8 grid">
                <div className="confirmation-content min-w-0">
                  <div className="ticket-grid gap-5.5 grid">
                    {[...tickets]
                      .sort((a, b) => {
                        const seatA =
                          reservation.items.find(
                            (item) =>
                              item.screening_seat_id === a.screening_seat_id,
                          )?.seat_label || "";
                        const seatB =
                          reservation.items.find(
                            (item) =>
                              item.screening_seat_id === b.screening_seat_id,
                          )?.seat_label || "";
                        return seatA.localeCompare(seatB, "sk", {
                          numeric: true,
                        });
                      })
                      .map((ticket) => (
                        <TicketCard
                          key={ticket.id}
                          ticket={ticket}
                          reservation={reservation}
                          title={screening?.movie_title}
                          venue={screening ? venueLabel(screening) : undefined}
                        />
                      ))}
                  </div>
                  {tickets.length === 0 && (
                    <button className="btn secondary" onClick={data.reload}>
                      Načítať vstupenky
                    </button>
                  )}
                  <div className="checkout-return flex-col items-start gap-4.5 flex">
                    <Link className="btn primary" to={visitsPath}>
                      {guest ? "Späť na program" : "Všetky moje návštevy"}{" "}
                      <ArrowRight size={17} />
                    </Link>
                    <span className="small muted">
                      Zaplatené {money(reservation.total_minor)} ·{" "}
                      {tickets.length} vstupenky
                    </span>
                    {guest && (
                      <span className="small muted">
                        Nakúpili ste ako hosť. Bez účtu túto stránku s
                        vstupenkami znova otvoríte iba v tomto okne prehliadača,
                        preto ju zatiaľ nezatvárajte.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="checkout-layout items-start gap-8 grid">
                <div className="checkout-context min-w-0">
                  <section
                    className={`surface checkout-details ${screening ? "has-context" : ""}`}
                  >
                    <div className="section-heading compact">
                      <h2>{screening?.movie_title || "Filmové premietanie"}</h2>
                      <Badge state={expired ? "EXPIRED" : reservation.state} />
                    </div>
                    <p className="muted">
                      {dateLabel(reservation.starts_at)} ·{" "}
                      {time(reservation.starts_at)}
                      {screening && ` · ${venueLabel(screening)}`}
                    </p>
                    {terminal && (
                      <>
                        <OrderSummary reservation={reservation} />
                        <InlineError error={error} />
                      </>
                    )}
                    {terminal ? (
                      <Link className="btn primary full" to="/">
                        Vybrať nové premietanie <ArrowRight size={17} />
                      </Link>
                    ) : (
                      <button
                        className="text-button danger"
                        onClick={() => setCancelOpen(true)}
                        disabled={busy}
                      >
                        Zrušiť rezerváciu a uvoľniť miesta
                      </button>
                    )}
                  </section>
                </div>
                {!terminal && (
                  <aside className="payment-panel">
                    <div className="hold-timer flex-wrap items-center gap-[9px] text-[14px] flex">
                      <Clock3 size={19} />
                      <span>Miesta vám držíme ešte</span>
                      <strong aria-label="Zostávajúci čas">
                        {remaining(reservation.expires_at, now)}
                      </strong>
                    </div>
                    <OrderSummary reservation={reservation} />
                    <InlineError error={error} />
                    {new Date(reservation.expires_at).getTime() - now <=
                      60_000 && (
                      <div className="notice" role="status">
                        Rezervácia vyprší o menej než minútu. Po vypršaní sa
                        miesta uvoľnia.
                      </div>
                    )}
                    <h2>
                      <CreditCard size={22} />
                      Dokončenie nákupu
                    </h2>
                    {demo ? (
                      <>
                        <div className="notice">
                          <Info size={19} />
                          <div>
                            <strong>Ukážková platba</strong>
                            <p>
                              Toto je testovacie kino. Žiadne peniaze sa
                              nestrhnú a údaje platobnej karty nepotrebujete.
                            </p>
                          </div>
                        </div>
                        {failed && (
                          <InlineError error="Platba neprešla. Miesta vám zatiaľ držíme, môžete to skúsiť znova." />
                        )}
                        <button
                          className="btn primary full"
                          disabled={busy || expired}
                          onClick={() => void pay("SUCCEEDED")}
                        >
                          {busy
                            ? "Dokončujeme nákup…"
                            : `Dokončiť za ${money(reservation.total_minor)}`}
                          <Check size={18} />
                        </button>
                        <button
                          className="text-button small full"
                          disabled={busy}
                          onClick={() => void pay("FAILED")}
                        >
                          Vyskúšať neúspešnú platbu
                        </button>
                      </>
                    ) : (
                      <div className="notice">
                        <Info size={18} />
                        <p>
                          Online platba momentálne nie je dostupná. Rezervácia
                          zostáva platná do uvedeného času.
                        </p>
                      </div>
                    )}
                  </aside>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {cancelOpen && (
        <Modal
          title="Zrušiť rezerváciu?"
          onClose={() => !busy && setCancelOpen(false)}
        >
          <p>Všetky vybrané miesta sa uvoľnia pre ostatných návštevníkov.</p>
          <InlineError error={error} />
          <div className="form-actions">
            <button
              className="btn secondary"
              onClick={() => setCancelOpen(false)}
              disabled={busy}
            >
              Ponechať rezerváciu
            </button>
            <button
              className="btn danger-button"
              onClick={() => void cancel()}
              disabled={busy}
            >
              {busy ? "Rušíme…" : "Zrušiť rezerváciu"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

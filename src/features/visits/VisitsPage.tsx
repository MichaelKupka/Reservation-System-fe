import {
  ArrowUpRight,
  Ban,
  Bell,
  CalendarDays,
  Ticket as TicketIcon,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { allPages, api } from "../../shared/api/client";
import type {
  Notification,
  Reservation,
  Screening,
  Ticket,
} from "../../shared/api/types";
import { dateLabel, money, remaining, time } from "../../shared/lib/format";
import { useAsync, useNow } from "../../shared/lib/hooks";
import { auditoriumLabel, venueLabel } from "../../shared/lib/venue";
import {
  Badge,
  Empty,
  ErrorState,
  Loading,
  PageHeading,
} from "../../shared/ui/index";
import { TicketCard } from "../booking/TicketCard";

export default function Visits() {
  const checkoutPath = (id: string) => `/rezervacie/${id}`;
  const [tab, setTab] = useState("reservations");
  const now = useNow();
  const data = useAsync(async (signal) => {
    const [reservations, tickets, notifications] = await Promise.all([
      allPages<Reservation>("/reservations", signal),
      allPages<Ticket>("/tickets", signal),
      allPages<Notification>("/notifications", signal),
    ]);
    const screenings = await Promise.all(
      [...new Set(reservations.map((r) => r.screening_id))].map((id) =>
        api<Screening>(`/screenings/${id}`, { signal }).catch(() => null),
      ),
    );
    return { reservations, tickets, notifications, screenings };
  }, []);
  return (
    <div className="container inner-page">
      <PageHeading eyebrow="VÁŠ OSOBNÝ FILMOVÝ KLUB" title="Moje návštevy">
        Všetky vaše plány, miesta a vstupenky. Pekne spolu.
      </PageHeading>
      <div className="tabs">
        <button
          className={tab === "reservations" ? "active" : ""}
          onClick={() => setTab("reservations")}
        >
          <CalendarDays size={17} />
          Rezervácie
        </button>
        <button
          className={tab === "tickets" ? "active" : ""}
          onClick={() => setTab("tickets")}
        >
          <TicketIcon size={17} />
          Vstupenky
        </button>
        <button
          className={tab === "notifications" ? "active" : ""}
          onClick={() => setTab("notifications")}
        >
          <Bell size={17} />
          Potvrdenia
        </button>
        <button className="text-button tab-refresh" onClick={data.reload}>
          Obnoviť
        </button>
      </div>
      {data.loading ? (
        <Loading />
      ) : data.error || !data.value ? (
        <ErrorState error={data.error} retry={data.reload} />
      ) : (
        <>
          {tab === "reservations" &&
            (data.value.reservations.length ? (
              <div className="reservation-list flex-col gap-3.5 flex">
                {data.value.reservations.map((reservation) => {
                  const screening = data.value?.screenings.find(
                    (s) => s?.id === reservation.screening_id,
                  );
                  const expired =
                    reservation.state === "HELD" &&
                    new Date(reservation.expires_at).getTime() <= now;
                  return (
                    <article
                      className="reservation-row items-center gap-6.5 flex"
                      key={reservation.id}
                    >
                      <div className="reservation-date text-center">
                        <strong>
                          {new Date(reservation.starts_at).getDate()}
                        </strong>
                        <span>
                          {new Intl.DateTimeFormat("sk-SK", {
                            month: "short",
                          }).format(new Date(reservation.starts_at))}
                        </span>
                      </div>
                      <div className="reservation-info min-w-0">
                        <Badge
                          state={expired ? "EXPIRED" : reservation.state}
                        />
                        <h2>
                          {screening?.movie_title || "Filmové premietanie"}
                        </h2>
                        <p>
                          {dateLabel(reservation.starts_at)} ·{" "}
                          {time(reservation.starts_at)}
                          {screening &&
                            auditoriumLabel(screening.auditorium_name) &&
                            ` · ${auditoriumLabel(screening.auditorium_name)}`}
                        </p>
                        <div className="small muted">
                          Miesta{" "}
                          {reservation.items
                            .map((i) => i.seat_label)
                            .join(", ")}
                          {reservation.state === "HELD" && !expired && (
                            <span className="hold-inline text-cinema-muted">
                              {" "}
                              · Zostáva {remaining(reservation.expires_at, now)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="reservation-action flex-col items-end gap-[15px] flex">
                        <strong>{money(reservation.total_minor)}</strong>
                        <Link
                          className="btn secondary small"
                          to={checkoutPath(reservation.id)}
                        >
                          {reservation.state === "HELD" && !expired
                            ? "Dokončiť nákup"
                            : reservation.state === "CONFIRMED"
                              ? "Vstupenky"
                              : "Detail"}
                          <ArrowUpRight size={16} />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <Empty title="Váš ďalší zážitok ešte len príde.">
                Zatiaľ nemáte rezerváciu. Vyberte si film a nájdite svoje
                miesto.
              </Empty>
            ))}
          {tab === "tickets" &&
            (data.value.tickets.length ? (
              <div className="ticket-grid gap-5.5 grid">
                {data.value.tickets.map((ticket) => {
                  const reservation = data.value?.reservations.find(
                    (r) => r.id === ticket.reservation_id,
                  );
                  const screening = data.value?.screenings.find(
                    (screening) => screening?.id === reservation?.screening_id,
                  );
                  return (
                    reservation && (
                      <TicketCard
                        key={ticket.id}
                        ticket={ticket}
                        reservation={reservation}
                        title={screening?.movie_title}
                        venue={screening ? venueLabel(screening) : undefined}
                      />
                    )
                  );
                })}
              </div>
            ) : (
              <Empty title="Vstupenky čakajú na váš prvý film.">
                Po dokončení nákupu ich nájdete práve tu.
              </Empty>
            ))}
          {tab === "notifications" && (
            <>
              <div className="notice">
                <Bell size={18} />
                <p>
                  V testovacom kine sa potvrdenia spracujú lokálne. Stav
                  „Spracované“ neznamená odoslaný e-mail.
                </p>
              </div>
              {data.value.notifications.length ? (
                <div className="reservation-list flex-col gap-3.5 flex">
                  {data.value.notifications.map((note) => {
                    const cancelled = note.kind === "SCREENING_CANCELLED";
                    return (
                      <article
                        className="notification-row items-center gap-4.5 flex"
                        key={note.id}
                      >
                        <span className="empty-icon small-icon">
                          {cancelled ? (
                            <Ban size={18} />
                          ) : (
                            <TicketIcon size={18} />
                          )}
                        </span>
                        <div>
                          <strong>
                            {cancelled
                              ? "Premietanie bolo zrušené"
                              : "Nákup je potvrdený"}
                          </strong>
                          <p className="muted small">
                            {dateLabel(note.created_at)} ·{" "}
                            {time(note.created_at)}
                          </p>
                        </div>
                        <Badge state={note.status} />
                        <Link
                          className="icon-button"
                          aria-label={
                            cancelled
                              ? "Zobraziť zrušenú rezerváciu"
                              : "Zobraziť potvrdenú rezerváciu"
                          }
                          to={checkoutPath(note.reservation_id)}
                        >
                          <ArrowUpRight size={18} />
                        </Link>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <Empty title="Zatiaľ žiadne potvrdenia." action={false}>
                  Po dokončení nákupu sa tu objaví jeho potvrdenie.
                </Empty>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

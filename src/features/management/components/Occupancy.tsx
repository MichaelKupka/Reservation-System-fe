import { useState } from "react";
import { api } from "../../../shared/api/client";
import type {
  Availability,
  Screening,
  ScreeningReservationPage,
  ScreeningSeatState,
} from "../../../shared/api/types";
import { dateLabel, money, time } from "../../../shared/lib/format";
import { useAsync } from "../../../shared/lib/hooks";
import {
  Badge,
  Empty,
  ErrorState,
  InlineError,
  Loading,
} from "../../../shared/ui/index";

export function Occupancy({ screening }: { screening: Screening }) {
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState("");
  const data = useAsync(
    async (signal) => {
      const [page, availability] = await Promise.all([
        api<ScreeningReservationPage>(
          `/staff/screenings/${screening.id}/reservations?limit=100`,
          { signal },
        ),
        api<Availability>(`/screenings/${screening.id}/seats`, {
          signal,
        }).catch(() => null),
      ]);
      return { page, availability };
    },
    [screening.id],
  );

  async function toggle(seatId: string, bookable: boolean) {
    setBusy(seatId);
    setError(undefined);
    try {
      await api<ScreeningSeatState>(
        `/screenings/${screening.id}/seats/${seatId}`,
        { method: "PATCH", body: { bookable } },
      );
      data.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy("");
    }
  }

  if (data.loading) return <Loading />;
  if (data.error || !data.value)
    return <ErrorState error={data.error} retry={data.reload} />;
  const { page, availability } = data.value;
  const counts = [
    { label: "Miesta v sále", value: page.occupancy.seats_total },
    { label: "Zaplatené", value: page.occupancy.confirmed },
    { label: "Blokácie", value: page.occupancy.held },
    { label: "Stiahnuté z predaja", value: page.occupancy.withdrawn },
    { label: "Voľné", value: page.occupancy.available },
  ];

  return (
    <div className="occupancy flex-col gap-6 flex">
      <p className="muted small">
        {screening.movie_title} · {dateLabel(screening.starts_at)} ·{" "}
        {time(screening.starts_at)} · {screening.auditorium_name}
      </p>

      <dl className="occupancy-counts gap-3 grid">
        {counts.map((item) => (
          <div className="surface" key={item.label}>
            <dt className="muted small">{item.label}</dt>
            <dd>
              <strong>{item.value}</strong>
            </dd>
          </div>
        ))}
      </dl>

      <InlineError error={error} />

      <section className="flex-col gap-3 flex">
        <h3>Miesta</h3>
        <p className="muted small">
          Stiahnuť z predaja možno iba nepredané a neblokované miesto.
        </p>
        {availability ? (
          <div className="occupancy-seats gap-2 flex">
            {availability.seats.map((seat) => {
              const withdrawn = !seat.available;
              return (
                <button
                  key={seat.id}
                  className={`btn small ${seat.available ? "secondary" : "danger-button"}`}
                  onClick={() => void toggle(seat.id, withdrawn)}
                  disabled={!!busy}
                  aria-pressed={withdrawn}
                >
                  {seat.seat_label}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="muted small">
            Mapa miest je dostupná až po zverejnení premietania.
          </p>
        )}
      </section>

      <section className="flex-col gap-3 flex">
        <h3>Rezervácie ({page.items.length})</h3>
        {page.items.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Zákazník</th>
                  <th>Miesta</th>
                  <th>Suma</th>
                  <th>Stav</th>
                  <th>Vytvorené</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <strong>{entry.customer_name}</strong>
                      <small>{entry.customer_email}</small>
                    </td>
                    <td>{entry.seat_labels.join(", ") || "—"}</td>
                    <td>{money(entry.total_minor, entry.currency)}</td>
                    <td>
                      <Badge state={entry.state} />
                    </td>
                    <td>
                      {dateLabel(entry.created_at)} · {time(entry.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty action={false} title="Na toto premietanie zatiaľ nikto nejde.">
            Rezervácie sa tu zobrazia po prvom nákupe.
          </Empty>
        )}
        <p className="muted small">
          Sumy sú zo simulovaného platobného adaptéra, nie skutočná tržba.
        </p>
      </section>
    </div>
  );
}

import { DoorOpen, Pencil, Users } from "lucide-react";
import { useState } from "react";
import { allPages, api } from "../../../shared/api/client";
import type { Auditorium, Movie, Screening } from "../../../shared/api/types";
import { dateLabel, money, time } from "../../../shared/lib/format";
import { useAsync } from "../../../shared/lib/hooks";
import {
  Badge,
  Empty,
  ErrorState,
  InlineError,
  Loading,
  Modal,
} from "../../../shared/ui/index";

export function Screenings({
  cinemaId,
  edit,
  review,
}: {
  cinemaId: string;
  edit: (s: Screening) => void;
  review: (s: Screening) => void;
}) {
  const data = useAsync(
    (signal) =>
      allPages<Screening>(`/staff/cinemas/${cinemaId}/screenings`, signal),
    [cinemaId],
  );
  const [future, setFuture] = useState(true);
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState("");
  const [cancel, setCancel] = useState<Screening | null>(null);
  async function action(screening: Screening, kind: string) {
    setBusy(screening.id);
    setError(undefined);
    try {
      await api(`/screenings/${screening.id}/${kind}`, { method: "POST" });
      setCancel(null);
      data.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy("");
    }
  }
  if (data.loading) return <Loading />;
  if (data.error) return <ErrorState error={data.error} retry={data.reload} />;
  const list = (data.value || []).filter(
    (s) => !future || new Date(s.ends_at).getTime() > Date.now(),
  );
  return (
    <>
      <div className="table-toolbar justify-between gap-5 flex">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={future}
            onChange={(e) => setFuture(e.target.checked)}
          />
          Iba nadchádzajúce premietania
        </label>
        <span className="muted small">{list.length} záznamov</span>
      </div>
      <InlineError error={error} />
      {list.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Film a termín</th>
                <th>Sála</th>
                <th>Cena</th>
                <th>Stav</th>
                <th>
                  <span className="sr-only">Akcie</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.movie_title}</strong>
                    <small>
                      {dateLabel(s.starts_at)} · {time(s.starts_at)} –{" "}
                      {time(s.ends_at)}
                    </small>
                  </td>
                  <td>{s.auditorium_name}</td>
                  <td>{money(s.price_minor)}</td>
                  <td>
                    <Badge state={s.state} />
                  </td>
                  <td>
                    <div className="row-actions justify-end items-center gap-3 flex">
                      {s.state === "DRAFT" && (
                        <>
                          <button
                            className="icon-button"
                            aria-label={`Upraviť ${s.movie_title}`}
                            onClick={() => edit(s)}
                            disabled={!!busy}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="btn secondary small"
                            onClick={() => void action(s, "publish")}
                            disabled={!!busy}
                          >
                            Zverejniť
                          </button>
                        </>
                      )}
                      <button
                        className="btn secondary small"
                        onClick={() => review(s)}
                        disabled={!!busy}
                      >
                        <Users size={14} />
                        Obsadenosť
                      </button>
                      {s.state !== "CANCELLED" && s.state !== "FINISHED" && (
                        <button
                          className="text-button danger small"
                          onClick={() => setCancel(s)}
                          disabled={!!busy}
                        >
                          Zrušiť
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty action={false} title="Plátno čaká na váš program.">
          Pridajte nové premietanie a zverejnite ho pre návštevníkov.
        </Empty>
      )}
      {cancel && (
        <Modal
          title="Zrušiť premietanie?"
          onClose={() => !busy && setCancel(null)}
        >
          <p>
            {cancel.movie_title} · {dateLabel(cancel.starts_at)} ·{" "}
            {time(cancel.starts_at)}
          </p>
          <p className="muted">
            Predaj sa zastaví, rezervácie sa zrušia a všetky vydané vstupenky
            prestanú platiť. Zákazníkom sa vytvorí požiadavka na informovanie.
            Vrátenie peňazí tým nevzniká — platobné záznamy zostávajú nezmenené.
          </p>
          <InlineError error={error} />
          <div className="form-actions">
            <button
              className="btn secondary"
              onClick={() => setCancel(null)}
              disabled={!!busy}
            >
              Ponechať v programe
            </button>
            <button
              className="btn danger-button"
              onClick={() => void action(cancel, "cancel")}
              disabled={!!busy}
            >
              Zrušiť premietanie
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
export function Movies({ edit }: { edit: (m: Movie) => void }) {
  const data = useAsync((signal) => allPages<Movie>("/staff/movies", signal));
  if (data.loading) return <Loading />;
  if (data.error) return <ErrorState error={data.error} retry={data.reload} />;
  return data.value?.length ? (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Film</th>
            <th>Dĺžka</th>
            <th>Vek</th>
            <th>Dostupnosť</th>
            <th>
              <span className="sr-only">Akcie</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.value.map((m) => (
            <tr key={m.id}>
              <td>
                <strong>{m.title}</strong>
                <small className="truncate">{m.description}</small>
              </td>
              <td>{m.duration_minutes} min</td>
              <td>{m.age_rating}+</td>
              <td>
                <span
                  className={`badge ${m.is_active ? "published" : "cancelled"}`}
                >
                  {m.is_active ? "Aktívny" : "Neaktívny"}
                </span>
              </td>
              <td>
                <button className="btn secondary small" onClick={() => edit(m)}>
                  <Pencil size={14} />
                  Upraviť
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty action={false} title="Pridajte prvý film.">
      Z filmu potom vytvoríte konkrétne premietanie.
    </Empty>
  );
}
export function Rooms({ cinemaId }: { cinemaId: string }) {
  const data = useAsync(
    (signal) =>
      allPages<Auditorium>(`/cinemas/${cinemaId}/auditoriums`, signal),
    [cinemaId],
  );
  if (data.loading) return <Loading />;
  if (data.error) return <ErrorState error={data.error} retry={data.reload} />;
  return data.value?.length ? (
    <div className="admin-card-grid gap-5 grid">
      {data.value.map((room) => (
        <article key={room.id} className="surface room-card">
          <DoorOpen size={28} />
          <h2>{room.name}</h2>
          <p className="muted">{room.seat_count} číslovaných sedadiel</p>
          <span className="badge">Pripravená na premietanie</span>
        </article>
      ))}
    </div>
  ) : (
    <Empty action={false} title="Pripravte sálu pre prvých divákov.">
      Vytvorte sálu s počtom radov a miest v každom rade.
    </Empty>
  );
}

import { useState } from "react";
import { allPages, api } from "../../../shared/api/client";
import type {
  Auditorium,
  Cinema,
  Movie,
  Role,
  Screening,
  User,
} from "../../../shared/api/types";
import { localInput } from "../../../shared/lib/format";
import { useAsync } from "../../../shared/lib/hooks";
import { Empty, ErrorState, Loading } from "../../../shared/ui/index";

import { Field, MutationForm, number, text } from "./ManagementForm";
export function MovieEditor({
  value,
  done,
}: {
  value?: Movie;
  done: () => void;
}) {
  return (
    <MutationForm
      done={done}
      save={(data) =>
        api(value ? `/movies/${value.id}` : "/movies", {
          method: value ? "PUT" : "POST",
          body: {
            title: text(data, "title"),
            description: text(data, "description"),
            duration_minutes: number(data, "duration_minutes"),
            age_rating: number(data, "age_rating"),
            is_active: data.has("is_active"),
          },
        })
      }
    >
      <Field
        label="Názov filmu"
        name="title"
        value={value?.title}
        maxLength={200}
      />
      <label>
        Popis
        <textarea
          name="description"
          defaultValue={value?.description}
          maxLength={5000}
          rows={4}
        />
      </label>
      <div className="form-grid">
        <Field
          label="Dĺžka (minúty)"
          name="duration_minutes"
          type="number"
          value={value?.duration_minutes || 120}
          min={1}
          max={600}
        />
        <Field
          label="Veková hranica"
          name="age_rating"
          type="number"
          value={value?.age_rating || 0}
          min={0}
          max={18}
        />
      </div>
      <label className="checkbox">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={value?.is_active ?? true}
        />
        Aktívny v katalógu
      </label>
      {value && (
        <p className="small muted">
          Film použitý v zverejnenom programe už má nemenné údaje. Jeho aktivitu
          môžete meniť.
        </p>
      )}
    </MutationForm>
  );
}
export function CinemaEditor({
  value,
  done,
}: {
  value?: Cinema;
  done: () => void;
}) {
  return (
    <MutationForm
      done={done}
      save={(data) =>
        api(value ? `/cinemas/${value.id}` : "/cinemas", {
          method: value ? "PUT" : "POST",
          body: { name: text(data, "name"), address: text(data, "address") },
        })
      }
    >
      <Field
        label="Názov kina"
        name="name"
        value={value?.name}
        maxLength={120}
      />
      <Field
        label="Adresa"
        name="address"
        value={value?.address}
        maxLength={300}
      />
    </MutationForm>
  );
}
export function RoomEditor({
  cinemaId,
  done,
}: {
  cinemaId: string;
  done: () => void;
}) {
  return (
    <MutationForm
      done={done}
      save={(data) =>
        api(`/cinemas/${cinemaId}/auditoriums`, {
          method: "POST",
          body: {
            name: text(data, "name"),
            rows: number(data, "rows"),
            seats_per_row: number(data, "seats_per_row"),
          },
        })
      }
    >
      <Field label="Názov sály" name="name" maxLength={100} />
      <div className="form-grid">
        <Field
          label="Počet radov"
          name="rows"
          type="number"
          value={6}
          min={1}
          max={50}
        />
        <Field
          label="Miest v rade"
          name="seats_per_row"
          type="number"
          value={10}
          min={1}
          max={50}
        />
      </div>
      <p className="small muted">
        Vytvorí sa pevná mriežka číslovaných miest. Existujúce rozloženie sa
        neskôr nemení.
      </p>
    </MutationForm>
  );
}
export function ScreeningEditor({
  value,
  cinemaId,
  done,
}: {
  value?: Screening;
  cinemaId: string;
  done: () => void;
}) {
  const data = useAsync(
    async (signal) => {
      const [movies, rooms] = await Promise.all([
        allPages<Movie>("/staff/movies", signal),
        allPages<Auditorium>(`/cinemas/${cinemaId}/auditoriums`, signal),
      ]);
      return { movies: movies.filter((m) => m.is_active), rooms };
    },
    [cinemaId],
  );
  if (data.loading) return <Loading />;
  if (data.error || !data.value)
    return <ErrorState error={data.error} retry={data.reload} />;
  if (!value && (!data.value.rooms.length || !data.value.movies.length))
    return (
      <Empty action={false} title="Najskôr pripravte film a sálu.">
        Pridajte aspoň jeden aktívny film a sálu v tomto kine.
      </Empty>
    );
  return (
    <MutationForm
      done={done}
      label={value ? "Uložiť návrh" : "Vytvoriť návrh"}
      save={(form) => {
        const body = {
          starts_at: new Date(text(form, "starts_at")).toISOString(),
          sales_close_at: text(form, "sales_close_at")
            ? new Date(text(form, "sales_close_at")).toISOString()
            : null,
          price_minor: Math.round(number(form, "price") * 100),
          ...(!value
            ? {
                movie_id: text(form, "movie_id"),
                auditorium_id: text(form, "auditorium_id"),
              }
            : {}),
        };
        return api(value ? `/screenings/${value.id}` : "/screenings", {
          method: value ? "PUT" : "POST",
          body,
        });
      }}
    >
      {!value ? (
        <>
          <label>
            Film
            <select name="movie_id" required>
              {data.value.movies.map((m) => (
                <option value={m.id} key={m.id}>
                  {m.title} · {m.duration_minutes} min
                </option>
              ))}
            </select>
          </label>
          <label>
            Sála
            <select name="auditorium_id" required>
              {data.value.rooms.map((r) => (
                <option value={r.id} key={r.id}>
                  {r.name} · {r.seat_count} miest
                </option>
              ))}
            </select>
          </label>
        </>
      ) : (
        <p>
          <strong>{value.movie_title}</strong> · {value.auditorium_name}
        </p>
      )}
      <Field
        label="Začiatok premietania"
        name="starts_at"
        type="datetime-local"
        value={localInput(
          value?.starts_at || new Date(Date.now() + 86400000).toISOString(),
        )}
      />
      <Field
        label="Koniec predaja (voliteľné)"
        name="sales_close_at"
        type="datetime-local"
        value={value ? localInput(value.sales_close_at) : undefined}
        required={false}
      />
      <p className="small muted">
        Časy sú v časovom pásme vášho zariadenia. Bez vyplnenia sa predaj končí
        15 minút pred začiatkom.
      </p>
      <Field
        label="Cena jedného miesta (€)"
        name="price"
        type="number"
        value={(value?.price_minor || 1000) / 100}
        min={0.01}
        max={1000}
        step="0.01"
      />
    </MutationForm>
  );
}
export function UserEditor({
  value,
  cinemas,
  done,
}: {
  value: User;
  cinemas: Cinema[];
  done: () => void;
}) {
  const [role, setRole] = useState<Role>(value.role);
  return (
    <MutationForm
      done={done}
      save={(data) =>
        api(`/users/${value.id}`, {
          method: "PATCH",
          body: {
            full_name: text(data, "full_name"),
            role,
            is_active: data.has("is_active"),
            cinema_ids: role === "MANAGER" ? data.getAll("cinema_ids") : [],
          },
        })
      }
    >
      <p className="muted">{value.email}</p>
      <Field
        label="Meno"
        name="full_name"
        value={value.full_name}
        maxLength={120}
      />
      <label>
        Rola
        <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value="USER">Zákazník</option>
          <option value="MANAGER">Manažér</option>
          <option value="ADMIN">Administrátor</option>
        </select>
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={value.is_active}
        />
        Aktívny účet
      </label>
      {role === "MANAGER" && (
        <div className="cinema-assignments flex-col gap-[13px] flex">
          <strong>Pridelené kiná</strong>
          {cinemas.map((c) => (
            <label className="checkbox" key={c.id}>
              <input
                type="checkbox"
                name="cinema_ids"
                value={c.id}
                defaultChecked={value.cinema_ids.includes(c.id)}
              />
              {c.name}
            </label>
          ))}
          {!cinemas.length && <p className="muted">Najskôr vytvorte kino.</p>}
        </div>
      )}
      <p className="small muted">
        Zmeny oprávnení platia okamžite. Posledného aktívneho administrátora
        nemožno odstrániť.
      </p>
    </MutationForm>
  );
}

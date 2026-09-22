import {
  Building2,
  CalendarDays,
  Clapperboard,
  DoorOpen,
  History,
  Pencil,
  Plus,
  ScanLine,
  Users,
} from "lucide-react";
import { useState } from "react";
import { allPages } from "../../shared/api/client";
import type { Cinema, Movie, Screening, User } from "../../shared/api/types";
import { useAsync } from "../../shared/lib/hooks";
import {
  Empty,
  ErrorState,
  Loading,
  Modal,
  Notice,
  PageHeading,
} from "../../shared/ui/index";
import { useAuth } from "../auth/auth-context";

import { AuditLog } from "./components/AuditLog";
import { Movies, Rooms, Screenings } from "./components/CatalogPanels";
import { CheckIn } from "./components/CheckIn";
import {
  CinemaEditor,
  MovieEditor,
  RoomEditor,
  ScreeningEditor,
  UserEditor,
} from "./components/Editors";
import { Occupancy } from "./components/Occupancy";
import { UserList } from "./components/UserList";
type Editor =
  | { kind: "movie"; value?: Movie }
  | { kind: "cinema"; value?: Cinema }
  | { kind: "auditorium" }
  | { kind: "screening"; value?: Screening }
  | { kind: "occupancy"; value: Screening }
  | { kind: "user"; value: User };

export default function Management() {
  const { user, refresh } = useAuth();
  const [tab, setTab] = useState("screenings");
  const [cinemaId, setCinemaId] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const cinemas = useAsync(
    (signal) => allPages<Cinema>("/cinemas", signal),
    [revision, user?.id],
  );
  const allowed = (cinemas.value || []).filter(
    (c) => user?.role === "ADMIN" || user?.cinema_ids.includes(c.id),
  );
  const activeCinema = allowed.some((c) => c.id === cinemaId)
    ? cinemaId
    : allowed[0]?.id || "";
  const tabs = [
    { id: "screenings", name: "Program", icon: CalendarDays },
    { id: "movies", name: "Filmy", icon: Clapperboard },
    { id: "auditoriums", name: "Sály", icon: DoorOpen },
    { id: "checkin", name: "Kontrola vstupu", icon: ScanLine },
    ...(user?.role === "ADMIN"
      ? [
          { id: "cinemas", name: "Kiná", icon: Building2 },
          { id: "users", name: "Používatelia", icon: Users },
          { id: "audit", name: "Zásahy", icon: History },
        ]
      : []),
  ];
  function saved() {
    setEditor(null);
    setRevision((v) => v + 1);
    setNotice("Zmeny sú uložené.");
    void refresh();
  }
  const canCreate =
    tab !== "users" &&
    tab !== "checkin" &&
    tab !== "audit" &&
    (!(tab === "screenings" || tab === "auditoriums") || !!activeCinema);
  function create() {
    const kind = {
      screenings: "screening",
      movies: "movie",
      auditoriums: "auditorium",
      cinemas: "cinema",
    }[tab] as "screening" | "movie" | "auditorium" | "cinema";
    setEditor({ kind });
  }
  return (
    <div className="container inner-page management">
      <PageHeading
        eyebrow={user?.role === "ADMIN" ? "ADMINISTRÁCIA" : "PREVÁDZKA KINA"}
        title="Za oponou."
        action={
          canCreate && (
            <button className="btn primary" onClick={create}>
              <Plus size={18} />
              {
                (
                  {
                    screenings: "Nové premietanie",
                    movies: "Nový film",
                    auditoriums: "Nová sála",
                    cinemas: "Nové kino",
                  } as Record<string, string>
                )[tab]
              }
            </button>
          )
        }
      >
        Všetko, čo potrebuje dobrý filmový večer.
      </PageHeading>
      <div className="management-nav flex-col gap-0 flex">
        <div className="tabs">
          {tabs.map((item) => (
            <button
              key={item.id}
              className={tab === item.id ? "active" : ""}
              onClick={() => {
                setTab(item.id);
                setNotice("");
              }}
            >
              <item.icon size={17} />
              {item.name}
            </button>
          ))}
        </div>
        {(tab === "screenings" || tab === "auditoriums") && (
          <label className="management-cinema text-cinema-muted flex-row items-center gap-[15px] flex">
            Kino
            <select
              value={activeCinema}
              onChange={(e) => setCinemaId(e.target.value)}
            >
              {allowed.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              {!allowed.length && (
                <option value="">Žiadne pridelené kino</option>
              )}
            </select>
          </label>
        )}
      </div>
      {notice && <Notice>{notice}</Notice>}
      {cinemas.loading ? (
        <Loading />
      ) : cinemas.error ? (
        <ErrorState error={cinemas.error} retry={cinemas.reload} />
      ) : (
        <>
          {tab === "screenings" &&
            (activeCinema ? (
              <Screenings
                key={`${activeCinema}-${revision}`}
                cinemaId={activeCinema}
                edit={(value) => setEditor({ kind: "screening", value })}
                review={(value) => setEditor({ kind: "occupancy", value })}
              />
            ) : (
              <Empty action={false} title="Najskôr potrebujete kino.">
                Administrátor vám môže prideliť existujúce kino alebo vytvoriť
                nové.
              </Empty>
            ))}
          {tab === "movies" && (
            <Movies
              key={revision}
              edit={(value) => setEditor({ kind: "movie", value })}
            />
          )}
          {tab === "auditoriums" &&
            (activeCinema ? (
              <Rooms
                key={`${activeCinema}-${revision}`}
                cinemaId={activeCinema}
              />
            ) : (
              <Empty action={false} title="Žiadne pridelené kino.">
                Sály sa zobrazia po pridelení kina.
              </Empty>
            ))}
          {tab === "cinemas" && user?.role === "ADMIN" && (
            <div className="admin-card-grid gap-5 grid">
              {cinemas.value?.map((c) => (
                <article className="surface" key={c.id}>
                  <Building2 size={25} />
                  <h2>{c.name}</h2>
                  <p className="muted">{c.address}</p>
                  <button
                    className="btn secondary small"
                    onClick={() => setEditor({ kind: "cinema", value: c })}
                  >
                    <Pencil size={15} />
                    Upraviť
                  </button>
                </article>
              ))}
            </div>
          )}
          {tab === "users" && user?.role === "ADMIN" && (
            <UserList
              key={revision}
              edit={(value) => setEditor({ kind: "user", value })}
            />
          )}
          {tab === "audit" && user?.role === "ADMIN" && (
            <AuditLog key={revision} />
          )}
          {tab === "checkin" && <CheckIn />}
        </>
      )}
      {editor && (
        <Modal
          title={
            editor.kind === "user"
              ? "Upraviť používateľa"
              : editor.kind === "occupancy"
                ? "Obsadenosť a rezervácie"
                : editor.kind === "screening"
                  ? editor.value
                    ? "Upraviť premietanie"
                    : "Nové premietanie"
                  : editor.kind === "movie"
                    ? editor.value
                      ? "Upraviť film"
                      : "Nový film"
                    : editor.kind === "cinema"
                      ? editor.value
                        ? "Upraviť kino"
                        : "Nové kino"
                      : "Nová sála"
          }
          onClose={() => setEditor(null)}
        >
          {editor.kind === "occupancy" && (
            <Occupancy screening={editor.value} />
          )}
          {editor.kind === "movie" && (
            <MovieEditor value={editor.value} done={saved} />
          )}
          {editor.kind === "cinema" && (
            <CinemaEditor value={editor.value} done={saved} />
          )}
          {editor.kind === "auditorium" && (
            <RoomEditor cinemaId={activeCinema} done={saved} />
          )}
          {editor.kind === "screening" && (
            <ScreeningEditor
              value={editor.value}
              cinemaId={activeCinema}
              done={saved}
            />
          )}
          {editor.kind === "user" && (
            <UserEditor
              value={editor.value}
              cinemas={cinemas.value || []}
              done={saved}
            />
          )}
        </Modal>
      )}
    </div>
  );
}

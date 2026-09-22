import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  MapPin,
  Search,
  Ticket,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { allPages } from "../../shared/api/client";
import type { Cinema, Movie, Screening } from "../../shared/api/types";
import { filmArtwork } from "../../shared/lib/artwork";
import { dateLabel, dayKey, money, time } from "../../shared/lib/format";
import { useAsync, useNow } from "../../shared/lib/hooks";
import { auditoriumLabel } from "../../shared/lib/venue";
import { Empty, ErrorState, Loading, Poster } from "../../shared/ui/index";

function duration(screening: Screening) {
  return Math.round(
    (new Date(screening.ends_at).getTime() -
      new Date(screening.starts_at).getTime()) /
      60000,
  );
}

export default function Programme() {
  const data = useAsync(async (signal) => {
    const [movies, cinemas, screenings] = await Promise.all([
      allPages<Movie>("/movies", signal),
      allPages<Cinema>("/cinemas", signal),
      allPages<Screening>(
        `/screenings?starts_from=${encodeURIComponent(new Date().toISOString())}`,
        signal,
      ),
    ]);
    return {
      movies,
      cinemas,
      screenings: screenings.sort((a, b) =>
        a.starts_at.localeCompare(b.starts_at),
      ),
    };
  });
  const [selectedDate, setDate] = useState("");
  const [cinema, setCinema] = useState(
    () => new URLSearchParams(window.location.search).get("kino") || "",
  );
  const [query, setQuery] = useState("");
  const now = useNow();
  const activeDate =
    selectedDate ||
    (data.value?.screenings[0]
      ? dayKey(data.value.screenings[0].starts_at)
      : dayKey(new Date()));
  const dates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, n) => {
        const date = new Date();
        date.setHours(12, 0, 0, 0);
        date.setDate(date.getDate() + n);
        return date;
      }),
    [],
  );
  const screenings = data.value?.screenings || [];
  const filtered = screenings.filter(
    (screening) =>
      (activeDate === "all" || dayKey(screening.starts_at) === activeDate) &&
      (!cinema || screening.cinema_id === cinema) &&
      screening.movie_title
        .toLocaleLowerCase("sk")
        .includes(query.toLocaleLowerCase("sk")),
  );
  const groups = [
    ...new Set(filtered.map((screening) => screening.movie_id)),
  ].map((id) => ({
    id,
    movie: data.value?.movies.find((movie) => movie.id === id),
    screenings: filtered.filter((screening) => screening.movie_id === id),
  }));
  const films = [
    ...new Set(screenings.map((screening) => screening.movie_id)),
  ].map((id) => ({
    id,
    movie: data.value?.movies.find((movie) => movie.id === id),
    screening: screenings.find((screening) => screening.movie_id === id)!,
  }));
  const featured =
    screenings.find(
      (screening) => new Date(screening.sales_close_at).getTime() > now,
    ) || screenings[0];
  const featuredMovie = data.value?.movies.find(
    (movie) => movie.id === featured?.movie_id,
  );
  const featuredOpen =
    featured && new Date(featured.sales_close_at).getTime() > now;

  return (
    <div className="programme">
      <section className="programme-hero relative isolate flex items-center">
        {featured && (
          <img
            className="programme-backdrop absolute inset-0 h-full w-full object-cover"
            src={filmArtwork(featured.movie_title)}
            alt=""
            fetchPriority="high"
          />
        )}
        <div className="programme-hero-shade absolute inset-0" />
        <div className="container programme-hero-content relative w-full">
          <div className="programme-hero-copy flex flex-col items-start">
            <p className="programme-kicker flex items-center gap-3">
              <span /> NA VEĽKOM PLÁTNE
            </p>
            <h1>{featured?.movie_title || "Váš ďalší filmový večer"}</h1>
            {featured && (
              <div className="programme-hero-facts flex flex-wrap items-center gap-x-4 gap-y-2">
                {featuredMovie && (
                  <span className="programme-age">
                    {featuredMovie.age_rating}+
                  </span>
                )}
                <span className="flex items-center gap-2">
                  <Clock3 size={15} />
                  {featuredMovie?.duration_minutes || duration(featured)} min
                </span>
                <span>{money(featured.price_minor, featured.currency)}</span>
              </div>
            )}
            {featuredMovie?.description && (
              <p className="programme-hero-description">
                {featuredMovie.description}
              </p>
            )}
            {featured ? (
              <p className="programme-hero-screening flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  {dateLabel(featured.starts_at)} · {time(featured.starts_at)}
                </span>
                <span className="programme-hero-location">
                  {featured.cinema_name}
                </span>
              </p>
            ) : (
              <p className="programme-hero-description">
                {data.loading
                  ? "Načítavame aktuálny program kín."
                  : data.error
                    ? "Program sa nepodarilo načítať. Skúste to znova nižšie."
                    : "Nové premietania nájdete v našom programe."}
              </p>
            )}
            <div className="programme-hero-actions flex flex-wrap items-center gap-5">
              {featuredOpen ? (
                <Link className="btn primary" to={`/rezervovat/${featured.id}`}>
                  <Ticket size={18} /> Rezervovať miesta
                </Link>
              ) : (
                <a className="btn primary" href="#program">
                  Pozrieť program <ArrowRight size={18} />
                </a>
              )}
              <a
                className="programme-browse flex items-center gap-2"
                href="#filmy"
              >
                Objaviť filmy <ArrowDown size={16} />
              </a>
            </div>
          </div>
        </div>
        <a
          className="programme-hero-scroll absolute flex items-center gap-3"
          href="#program"
        >
          PROGRAM KINA <ArrowDown size={15} />
        </a>
      </section>

      <div className="container programme-content">
        <section
          className="programme-collection"
          id="filmy"
          aria-labelledby="films-heading"
        >
          <div className="programme-section-heading flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="programme-kicker">FILMY, KTORÉ PRÁVE HRÁME</p>
              <h2 id="films-heading">Na veľkom plátne</h2>
            </div>
            <a
              className="programme-section-link flex items-center gap-2"
              href="#program"
            >
              Všetky premietania <ArrowRight size={16} />
            </a>
          </div>
          {films.length > 0 ? (
            <div
              className={`programme-film-rail flex gap-5${films.length === 1 ? " programme-single-film" : ""}`}
            >
              {films.map(({ id, movie, screening }) => (
                <a
                  className="programme-film flex shrink-0 flex-col"
                  key={id}
                  href="#program"
                  onClick={() => {
                    setQuery(screening.movie_title);
                    setDate("all");
                    setCinema("");
                  }}
                  aria-label={`${screening.movie_title}, zobraziť premietania`}
                >
                  <div className="programme-film-art relative">
                    <Poster title={screening.movie_title} />
                  </div>
                  <div className="programme-film-copy">
                    <div>
                      {films.length === 1 && (
                        <p className="programme-kicker">AKTUÁLNE V PROGRAME</p>
                      )}
                      <h3>{screening.movie_title}</h3>
                      <p className="flex items-center gap-3">
                        <span>
                          {movie?.duration_minutes || duration(screening)} min
                        </span>
                        {movie && <span>{movie.age_rating}+</span>}
                      </p>
                      {films.length === 1 && movie?.description && (
                        <p className="programme-film-description">
                          {movie.description}
                        </p>
                      )}
                    </div>
                    {films.length === 1 && (
                      <div className="programme-film-session">
                        <p className="programme-kicker">
                          NAJBLIŽŠIE PREMIETANIE
                        </p>
                        <p className="programme-film-date">
                          {dateLabel(screening.starts_at)}
                        </p>
                        <p className="programme-film-time">
                          {time(screening.starts_at)}{" "}
                          <span>{screening.cinema_name}</span>
                        </p>
                        <span className="programme-film-link flex items-center gap-3">
                          Vybrať premietanie <ArrowUpRight size={18} />
                        </span>
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="programme-collection-status">
              {data.loading
                ? "Načítavame filmy…"
                : data.error
                  ? "Filmy sú dočasne nedostupné."
                  : "Aktuálne nie sú naplánované žiadne filmy."}
            </p>
          )}
        </section>

        <section
          className="programme-section"
          id="program"
          aria-labelledby="programme-heading"
        >
          <div className="programme-section-heading flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="programme-kicker">VYBERTE SI SVOJ TERMÍN</p>
              <h2 id="programme-heading">Program kina</h2>
            </div>
            <label className="cinema-filter flex items-center gap-2">
              <MapPin size={17} />
              <span className="sr-only">Vyberte kino</span>
              <select
                value={cinema}
                onChange={(event) => setCinema(event.target.value)}
              >
                <option value="">Všetky kiná</option>
                {data.value?.cinemas.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="programme-toolbar flex items-center justify-between gap-6">
            <div
              className="date-tabs flex"
              role="group"
              aria-label="Deň premietania"
            >
              {dates.map((date, index) => (
                <button
                  key={dayKey(date)}
                  className={activeDate === dayKey(date) ? "active" : ""}
                  onClick={() => setDate(dayKey(date))}
                  aria-pressed={activeDate === dayKey(date)}
                >
                  <span>
                    {index === 0
                      ? "Dnes"
                      : index === 1
                        ? "Zajtra"
                        : new Intl.DateTimeFormat("sk-SK", {
                            weekday: "short",
                          }).format(date)}
                  </span>
                  <strong>
                    {date.getDate()}. {date.getMonth() + 1}.
                  </strong>
                </button>
              ))}
            </div>
            <label className="calendar-picker flex items-center gap-2">
              <CalendarDays size={18} />
              <span className="sr-only">Iný dátum</span>
              <input
                type="date"
                aria-label="Iný dátum"
                value={activeDate === "all" ? "" : activeDate}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
          </div>
          <div className="programme-search flex items-center justify-between gap-5">
            <div className="programme-result-count flex flex-wrap items-center gap-4">
              <span aria-live="polite">
                {data.loading
                  ? "Načítavame program"
                  : `${filtered.length} ${filtered.length === 1 ? "premietanie" : filtered.length > 1 && filtered.length < 5 ? "premietania" : "premietaní"}`}
              </span>
              <button
                className={`text-button${activeDate === "all" ? " active" : ""}`}
                onClick={() => setDate("all")}
                aria-pressed={activeDate === "all"}
              >
                Všetky termíny
              </button>
            </div>
            <label className="search-field flex items-center gap-2">
              <Search size={17} />
              <input
                aria-label="Hľadať film"
                placeholder="Hľadať film"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>
          {data.loading ? (
            <Loading />
          ) : data.error ? (
            <ErrorState error={data.error} retry={data.reload} />
          ) : groups.length === 0 ? (
            <Empty title="Pre tento výber nemáme premietanie." action={false}>
              Skúste iný deň, kino alebo názov filmu.
            </Empty>
          ) : (
            <div className="movie-list grid">
              {groups.map(({ id, movie, screenings: filmScreenings }) => (
                <article key={id} className="movie-card grid">
                  <div className="movie-art relative">
                    <Poster
                      title={movie?.title || filmScreenings[0].movie_title}
                    />
                  </div>
                  <div className="movie-info">
                    <div className="movie-title-row flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="movie-meta flex items-center gap-3">
                          <span>V PROGRAME</span>
                          {movie && (
                            <span className="programme-age">
                              {movie.age_rating}+
                            </span>
                          )}
                        </div>
                        <h3>{movie?.title || filmScreenings[0].movie_title}</h3>
                      </div>
                      <span className="movie-price">
                        od{" "}
                        {money(
                          Math.min(
                            ...filmScreenings.map(
                              (screening) => screening.price_minor,
                            ),
                          ),
                          filmScreenings[0].currency,
                        )}
                      </span>
                    </div>
                    <div className="movie-facts flex flex-wrap items-center gap-4">
                      <span className="flex items-center gap-2">
                        <Clock3 size={15} />
                        {movie?.duration_minutes ||
                          duration(filmScreenings[0])}{" "}
                        min
                      </span>
                    </div>
                    {movie?.description && (
                      <p className="movie-description">{movie.description}</p>
                    )}
                    <p className="showtimes-label">VYBERTE SI PREMIETANIE</p>
                    <div className="showtimes flex flex-wrap gap-3">
                      {filmScreenings.map((screening) => {
                        const details = [
                          activeDate === "all"
                            ? dateLabel(screening.starts_at)
                            : "",
                          auditoriumLabel(screening.auditorium_name),
                        ]
                          .filter(Boolean)
                          .join(" · ");
                        const closed =
                          new Date(screening.sales_close_at).getTime() <= now;
                        return closed ? (
                          <span
                            key={screening.id}
                            className="showtime closed flex flex-col gap-1"
                          >
                            <strong>{time(screening.starts_at)}</strong>
                            <small>Predaj ukončený</small>
                          </span>
                        ) : (
                          <Link
                            key={screening.id}
                            to={`/rezervovat/${screening.id}`}
                            className="showtime flex flex-col gap-1"
                            aria-label={`${screening.movie_title}, ${dateLabel(screening.starts_at)}, ${time(screening.starts_at)}, ${screening.cinema_name}, vybrať miesta`}
                          >
                            <strong className="flex items-center justify-between gap-5">
                              {time(screening.starts_at)}{" "}
                              <ArrowUpRight size={17} />
                            </strong>
                            {details && <small>{details}</small>}
                            <small>{screening.cinema_name}</small>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        <div className="programme-cinemas flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <MapPin size={20} />
            <span>Nájdite svoje kino.</span>
          </div>
          <Link
            className="programme-section-link flex items-center gap-2"
            to="/kina"
          >
            Naše kiná <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
    </div>
  );
}

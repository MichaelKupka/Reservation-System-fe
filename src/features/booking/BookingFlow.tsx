import { Check, Clock3, MapPin } from "lucide-react";
import type { Screening } from "../../shared/api/types";
import { dateLabel, time } from "../../shared/lib/format";
import { filmArtwork } from "../../shared/lib/artwork";
import { Poster } from "../../shared/ui/index";
import { auditoriumLabel, venueLabel } from "../../shared/lib/venue";

export function BookingStepper({ step }: { step: 1 | 2 | 3 }) {
  return (
    <ol className="booking-steps grid grid-cols-3" aria-label="Priebeh nákupu">
      {["Miesta", "Platba", "Vstupenky"].map((label, index) => (
        <li
          key={label}
          className={
            index + 1 === step ? "current" : index + 1 < step ? "complete" : ""
          }
          aria-current={index + 1 === step ? "step" : undefined}
        >
          <b>
            {index + 1 < step ? (
              <Check size={13} aria-hidden="true" />
            ) : (
              index + 1
            )}
          </b>
          <span>{label}</span>
        </li>
      ))}
    </ol>
  );
}
export function FilmContext({ screening }: { screening: Screening }) {
  return (
    <div className="film-context min-w-0">
      <div className="context-poster">
        <Poster title={screening.movie_title} />
      </div>
      <div className="context-copy">
        <h2>{screening.movie_title}</h2>
        <p>{dateLabel(screening.starts_at)}</p>
        <div className="context-facts grid gap-2 text-cinema-muted text-sm">
          <span>
            <Clock3 size={15} />
            {time(screening.starts_at)} – {time(screening.ends_at)}
          </span>
          <span>
            <MapPin size={15} />
            {venueLabel(screening)}
          </span>
        </div>
      </div>
    </div>
  );
}
export function FilmBackdrop({ title }: { title?: string }) {
  return (
    <div className="film-backdrop" aria-hidden="true">
      <img src={filmArtwork(title)} alt="" fetchPriority="high" />
    </div>
  );
}
export function ScreeningDetails({ screening }: { screening: Screening }) {
  const date = new Date(screening.starts_at);
  const auditorium = auditoriumLabel(screening.auditorium_name);
  return (
    <aside
      className="screening-details flex flex-col gap-7"
      aria-label="Informácie o premietaní"
    >
      <div>
        <span className="screening-detail-label">Dátum</span>
        <div className="screening-date">
          <strong>{date.getDate()}</strong>
          <span>{date.toLocaleDateString("sk-SK", { month: "short" })}</span>
        </div>
      </div>
      <div>
        <span className="screening-detail-label">Začiatok</span>
        <strong className="screening-time">{time(screening.starts_at)}</strong>
      </div>
      <div>
        <span className="screening-detail-label">Kino a sála</span>
        <strong>{screening.cinema_name}</strong>
        {auditorium && <p>{auditorium}</p>}
      </div>
    </aside>
  );
}

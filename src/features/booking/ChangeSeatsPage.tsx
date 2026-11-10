import { Check, Info } from "lucide-react";
import { useParams } from "react-router-dom";
import { remaining } from "../../shared/lib/format";
import { useNow } from "../../shared/lib/hooks";
import { ErrorState, InlineError, Loading } from "../../shared/ui/index";
import {
  BookingStepper,
  FilmBackdrop,
  FilmContext,
  ScreeningDetails,
} from "./BookingFlow";
import { ChosenSeats, SelectionTotal } from "./ChosenSeats";
import {
  BackToReservation,
  LockedSeatChange,
  SeatChangeFrame,
} from "./SeatChangeFrame";
import { SeatPicker } from "./SeatPicker";
import { useSeatChange } from "./useSeatChange";

export default function ChangeSeats() {
  const { id } = useParams();
  const now = useNow();
  const change = useSeatChange(id);
  const { data } = change;
  if (data.loading) return <Loading label="Načítavame vaše miesta…" />;
  if (data.error || !data.value)
    return (
      <SeatChangeFrame id={id}>
        <ErrorState error={data.error} retry={data.reload} />
      </SeatChangeFrame>
    );
  const { reservation, screening, availability } = data.value;
  const editable =
    reservation.state === "HELD" &&
    new Date(reservation.expires_at).getTime() > now;
  if (!editable || !screening || !availability)
    return <LockedSeatChange reservation={reservation} />;
  const closed =
    !availability.sales_open ||
    new Date(availability.sales_close_at).getTime() <= now;
  const chosen = change.seats.filter((seat) =>
    change.selected.includes(seat.id),
  );
  return (
    <div className="booking-page cinema-flow relative">
      <FilmBackdrop title={screening.movie_title} />
      <div className="container">
        <BackToReservation id={id} />
        <header className="booking-top flex flex-col justify-end">
          <p className="eyebrow">ZMENA MIEST</p>
          <h1>{screening.movie_title}</h1>
          <p>Upravte výber miest. Čas na dokončenie nákupu sa nepredlžuje.</p>
        </header>
        <div className="booking-layout items-start gap-y-0 gap-x-8 grid">
          <FilmContext screening={screening} />
          <div className="booking-task min-w-0">
            <BookingStepper step={1} />
            <div className="auditorium-layout grid items-start">
              <section className="seat-panel" aria-label="Zmena sedadiel">
                <div className="seat-panel-heading">
                  <div>
                    <h2>Zmeňte svoje miesta</h2>
                    <span className="muted small">
                      Vyberte si najviac 6 miest. Miesta držíme ešte{" "}
                      {remaining(reservation.expires_at, now)}.
                    </span>
                  </div>
                </div>
                {change.selected.length === 6 && (
                  <div className="notice">
                    <Info size={16} />
                    <span>
                      Máte vybraných 6 miest. Pre iný výber najskôr jedno
                      odznačte.
                    </span>
                  </div>
                )}
                <SeatPicker
                  seats={change.seats}
                  selected={change.selected}
                  busy={change.busy}
                  closed={closed}
                  toggle={change.toggle}
                />
                <p className="seat-help">
                  <Info size={15} />
                  Pôvodné miesta uvoľníme až po uložení zmeny.
                </p>
              </section>
              <ScreeningDetails screening={screening} />
            </div>
          </div>
          <aside className="booking-summary">
            <ChosenSeats
              seats={chosen}
              busy={change.busy || closed}
              toggle={change.toggle}
            />
            <div className="booking-action">
              <SelectionTotal seats={chosen} />
              <button
                className="btn primary full"
                onClick={() => void change.save()}
                disabled={
                  closed ||
                  change.busy ||
                  !change.changed ||
                  !change.selected.length
                }
              >
                {change.busy ? "Ukladáme zmenu…" : "Uložiť zmenu miest"}
                <Check size={18} />
              </button>
            </div>
            <InlineError error={change.error} />
            <p className="summary-note text-cinema-muted text-left text-[12px]">
              Ak si to rozmyslíte, vráťte sa späť. Rezervácia zostane bez zmeny.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}

import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Reservation } from "../../shared/api/types";
import { InlineError } from "../../shared/ui/index";
import { FilmBackdrop } from "./BookingFlow";

export function BackToReservation({ id }: { id: string | undefined }) {
  return (
    <Link className="back-link" to={`/rezervacie/${id}`}>
      <ArrowLeft size={16} />
      Späť na rezerváciu
    </Link>
  );
}

/** Page frame for the seat-change states that show no seat map. */
export function SeatChangeFrame({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}) {
  return (
    <div className="booking-page cinema-flow relative">
      <FilmBackdrop />
      <div className="container">
        <BackToReservation id={id} />
        {children}
      </div>
    </div>
  );
}

const LOCKED_REASONS: Partial<Record<Reservation["state"], string>> = {
  CONFIRMED: "Rezervácia je už zaplatená, preto sa jej miesta nedajú meniť.",
  CANCELLED: "Rezervácia bola zrušená a jej miesta sme uvoľnili.",
};

/** Explain why a paid, cancelled or lapsed reservation cannot change its seats. */
export function LockedSeatChange({
  reservation,
}: {
  reservation: Reservation;
}) {
  return (
    <SeatChangeFrame id={reservation.id}>
      <header className="booking-top flex flex-col justify-end">
        <p className="eyebrow">ZMENA MIEST</p>
        <h1>Miesta už nie je možné zmeniť</h1>
      </header>
      <InlineError
        error={
          LOCKED_REASONS[reservation.state] ??
          "Čas na dokončenie nákupu vypršal a miesta sme uvoľnili."
        }
      />
    </SeatChangeFrame>
  );
}

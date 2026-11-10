import { X } from "lucide-react";
import type { Seat } from "../../shared/api/types";
import { money } from "../../shared/lib/format";

export function ChosenSeats({
  seats,
  busy,
  toggle,
}: {
  seats: Seat[];
  busy: boolean;
  toggle: (id: string) => void;
}) {
  return (
    <div className="chosen-seats flex-col gap-3 flex">
      <span className="small muted" role="status" aria-live="polite">
        Vaše miesta · {seats.length} {chosenWord(seats.length)}
      </span>
      <div>
        {seats.length ? (
          seats.map((seat) => (
            <button
              className="seat-chip"
              key={seat.id}
              disabled={busy}
              aria-label={`Odstrániť miesto ${seat.seat_label}`}
              onClick={() => {
                document
                  .querySelector<HTMLButtonElement>(
                    `[data-seat-id="${seat.id}"]`,
                  )
                  ?.focus();
                toggle(seat.id);
              }}
            >
              <span className="chosen-seat-label">
                <strong>{seat.row_number}</strong> rad{" "}
                <strong>{seat.seat_number}</strong> miesto
              </span>
              <span className="chosen-seat-price">
                {money(seat.price_minor)}
              </span>
              <X size={14} />
            </button>
          ))
        ) : (
          <span className="muted">Zatiaľ ste si nevybrali</span>
        )}
      </div>
    </div>
  );
}

function chosenWord(count: number) {
  return count >= 1 && count <= 4 ? "vybrané" : "vybraných";
}

function seatWord(count: number) {
  if (count === 1) return "miesto";
  return count >= 2 && count <= 4 ? "miesta" : "miest";
}

export function SelectionTotal({ seats }: { seats: Seat[] }) {
  const total = seats.reduce((sum, seat) => sum + seat.price_minor, 0);
  return (
    <div className="price-total justify-between items-center gap-3 text-[14px] flex">
      <span>
        Spolu{" "}
        <small>
          {seats.length} {seatWord(seats.length)}
        </small>
      </span>
      <strong>{money(total)}</strong>
    </div>
  );
}

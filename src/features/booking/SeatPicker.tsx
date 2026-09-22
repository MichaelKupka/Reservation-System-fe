import { Armchair, Check, List, X } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useRef, useState } from "react";
import type { Seat } from "../../shared/api/types";
import { money } from "../../shared/lib/format";

export function SeatPicker({
  seats,
  selected,
  busy,
  closed,
  toggle,
}: {
  seats: Seat[];
  selected: string[];
  busy: boolean;
  closed: boolean;
  toggle: (id: string) => void;
}) {
  const [list, setList] = useState(false);
  const [focused, setFocused] = useState<string>();
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const ordered = [...seats].sort(
    (a, b) => a.row_number - b.row_number || a.seat_number - b.seat_number,
  );
  const rows = [...new Set(ordered.map((seat) => seat.row_number))];
  const columns = Math.max(1, ...ordered.map((seat) => seat.seat_number));
  const activeId = ordered.some((seat) => seat.id === focused)
    ? focused
    : ordered[0]?.id;
  const disabled = (seat: Seat) =>
    busy ||
    closed ||
    (!seat.available && !selected.includes(seat.id)) ||
    (selected.length >= 6 && !selected.includes(seat.id));
  function move(event: KeyboardEvent<HTMLButtonElement>, seat: Seat) {
    const row = ordered.filter((item) => item.row_number === seat.row_number);
    const index = row.findIndex((item) => item.id === seat.id);
    let target: Seat | undefined;
    if (event.key === "ArrowLeft") target = row[index - 1];
    else if (event.key === "ArrowRight") target = row[index + 1];
    else if (event.key === "Home") target = event.ctrlKey ? ordered[0] : row[0];
    else if (event.key === "End")
      target = event.ctrlKey ? ordered.at(-1) : row.at(-1);
    else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      const nextRow =
        rows[
          rows.indexOf(seat.row_number) + (event.key === "ArrowUp" ? -1 : 1)
        ];
      target = ordered
        .filter((item) => item.row_number === nextRow)
        .sort(
          (a, b) =>
            Math.abs(a.seat_number - seat.seat_number) -
            Math.abs(b.seat_number - seat.seat_number),
        )[0];
    } else return;
    event.preventDefault();
    if (target) {
      setFocused(target.id);
      buttons.current.get(target.id)?.focus();
    }
  }
  return (
    <>
      <div className="map-tools items-center gap-5 flex">
        <p id="seat-instructions">
          {list
            ? "Vyberte miesto v zozname podľa radu."
            : "Šípky presúvajú fokus, medzerník vyberá miesto. Širšiu sálu posuňte do strán."}
        </p>
        <button className="btn secondary small" onClick={() => setList(!list)}>
          {list ? <Armchair size={16} /> : <List size={16} />}
          {list ? "Mapa sály" : "Zoznam miest"}
        </button>
      </div>
      {seats.length === 0 ? (
        <div className="empty-state">
          <h3>Miesta zatiaľ nie sú dostupné</h3>
          <p>Plán sály sa nepodarilo pripraviť. Skúste obnoviť dostupnosť.</p>
        </div>
      ) : list ? (
        <div className="seat-list">
          {rows.map((row) => (
            <fieldset key={row}>
              <legend>Rad {row}</legend>
              <div>
                {ordered
                  .filter((seat) => seat.row_number === row)
                  .map((seat) => (
                    <label key={seat.id}>
                      <input
                        type="checkbox"
                        checked={selected.includes(seat.id)}
                        disabled={disabled(seat)}
                        onChange={() => toggle(seat.id)}
                      />
                      <span>
                        Miesto {seat.seat_label}
                        <small>
                          {seat.available || selected.includes(seat.id)
                            ? money(seat.price_minor)
                            : "Nedostupné"}
                        </small>
                      </span>
                    </label>
                  ))}
              </div>
            </fieldset>
          ))}
        </div>
      ) : (
        <div
          className="seat-scroll"
          tabIndex={0}
          role="region"
          aria-label="Posúvateľný plán sály"
        >
          <div className="seat-map">
            <div className="screen-arc" />
            <span className="screen-label">PLÁTNO</span>
            <div
              className="seat-rows"
              role="grid"
              aria-label="Miesta v sále"
              aria-describedby="seat-instructions"
            >
              {rows.map((row) => (
                <div key={row} className="seat-row" role="row">
                  <span className="row-label" role="rowheader">
                    {row}
                  </span>
                  <div
                    className="seat-row-buttons"
                    role="presentation"
                    style={{
                      gridTemplateColumns: `repeat(${columns}, var(--seat-size))`,
                    }}
                  >
                    {ordered
                      .filter((seat) => seat.row_number === row)
                      .map((seat) => {
                        const chosen = selected.includes(seat.id);
                        return (
                          <div
                            role="gridcell"
                            key={seat.id}
                            style={{ gridColumn: seat.seat_number }}
                          >
                            <button
                              ref={(node) => {
                                if (node) buttons.current.set(seat.id, node);
                                else buttons.current.delete(seat.id);
                              }}
                              data-seat-id={seat.id}
                              className={`seat ${chosen ? "selected" : !seat.available ? "unavailable" : ""}`}
                              tabIndex={seat.id === activeId ? 0 : -1}
                              aria-disabled={disabled(seat)}
                              aria-pressed={chosen}
                              aria-label={`Miesto ${seat.seat_label}, ${money(seat.price_minor)}${!seat.available && !chosen ? ", obsadené" : chosen ? ", vybrané" : ", voľné"}`}
                              onFocus={() => setFocused(seat.id)}
                              onKeyDown={(event) => move(event, seat)}
                              onClick={() => {
                                if (!disabled(seat)) toggle(seat.id);
                              }}
                            >
                              <span>{seat.seat_number}</span>
                              {chosen ? (
                                <Check
                                  className="seat-mark"
                                  size={12}
                                  aria-hidden="true"
                                />
                              ) : !seat.available ? (
                                <X
                                  className="seat-mark"
                                  size={12}
                                  aria-hidden="true"
                                />
                              ) : null}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                  <span className="row-label" aria-hidden="true">
                    {row}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="seat-legend">
        <span>
          <i />
          Voľné
        </span>
        <span>
          <i className="selected">
            <Check size={10} />
          </i>
          Váš výber
        </span>
        <span>
          <i className="taken">
            <X size={10} />
          </i>
          Nedostupné
        </span>
      </div>
    </>
  );
}

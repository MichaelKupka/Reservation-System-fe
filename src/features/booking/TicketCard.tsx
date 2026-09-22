import { ArrowUpRight, Check, Copy, Ticket as TicketIcon } from "lucide-react";
import { useId, useState } from "react";
import type { Reservation, Ticket } from "../../shared/api/types";
import { dateLabel, time } from "../../shared/lib/format";
import { filmArtwork } from "../../shared/lib/artwork";
import { Badge, Modal } from "../../shared/ui/index";
import { TicketBarcode } from "./TicketBarcode";

export function TicketCard({
  ticket,
  reservation,
  title,
  venue,
}: {
  ticket: Ticket;
  reservation: Reservation;
  title?: string;
  venue?: string;
}) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const seat = reservation.items.find(
    (item) => item.screening_seat_id === ticket.screening_seat_id,
  );
  const seatLabel = seat?.seat_label || "—";
  const standardSeat = /^([A-Z]+)([1-9]\d*)$/.exec(seatLabel);
  const legacySeat = /^R([1-9]\d*)-S([1-9]\d*)$/.exec(seatLabel);
  const row = standardSeat?.[1] || legacySeat?.[1];
  const seatNumber = standardSeat?.[2] || legacySeat?.[2] || seatLabel;
  const shortDate = new Intl.DateTimeFormat("sk-SK", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(new Date(reservation.starts_at));
  const startsAt = time(reservation.starts_at);

  return (
    <>
      <article className="ticket-card grid" aria-labelledby={titleId}>
        <div className="ticket-stub flex flex-col justify-between">
          <div className="ticket-stub-facts grid grid-cols-2 gap-3">
            <div>
              {row && (
                <p>
                  <span>RAD</span> <strong>{row}</strong>
                </p>
              )}
              <p>
                <span>MIESTO</span> <strong>{seatNumber}</strong>
              </p>
            </div>
            <div className="ticket-stub-session">
              <time dateTime={reservation.starts_at}>{shortDate}</time>
              <strong>{startsAt}</strong>
            </div>
          </div>
          <button
            className="ticket-code-trigger flex flex-col items-center"
            onClick={() => setOpen(true)}
            aria-label="Zobraziť vstupenku"
          >
            <span className="ticket-barcode-preview" aria-hidden="true">
              <TicketBarcode value={ticket.code} />
            </span>
            <span className="ticket-open-label flex items-center justify-center gap-1">
              Zobraziť vstupenku <ArrowUpRight size={12} aria-hidden="true" />
            </span>
          </button>
          <div className="ticket-stub-footer flex items-center justify-between gap-2">
            <span>KINO KLUB</span>
            <span className="ticket-reference">
              {ticket.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
        </div>
        <div className="ticket-card-main relative grid">
          <img
            className="ticket-artwork"
            src={filmArtwork(title)}
            alt=""
            loading="lazy"
          />
          <div className="ticket-top flex items-center justify-between gap-3">
            <span>{venue || "KINO KLUB"}</span>
            <Badge state={ticket.status} />
          </div>
          <div className="ticket-film">
            <h3 id={titleId}>{title || "Váš filmový večer"}</h3>
          </div>
          <dl className={`ticket-details grid${row ? " has-row" : ""}`}>
            {row && (
              <div>
                <dt>RAD</dt>
                <dd>{row}</dd>
              </div>
            )}
            <div>
              <dt>MIESTO</dt>
              <dd>{seatNumber}</dd>
            </div>
            <div>
              <dt>DÁTUM</dt>
              <dd>
                <time dateTime={reservation.starts_at}>{shortDate}</time>
              </dd>
            </div>
            <div>
              <dt>ČAS</dt>
              <dd>
                <time dateTime={reservation.starts_at}>{startsAt}</time>
              </dd>
            </div>
          </dl>
        </div>
      </article>
      {open && (
        <Modal
          title="Vaša vstupenka"
          onClose={() => {
            setOpen(false);
            setCopied(false);
            setCopyError(false);
          }}
        >
          <div className="admission-code text-center flex-col items-center gap-4.5 flex">
            <TicketIcon size={36} />
            <h3>{title || "Filmový večer"}</h3>
            <p>
              {dateLabel(reservation.starts_at)} · {time(reservation.starts_at)}
              <br />
              Miesto <strong>{seat?.seat_label}</strong>
            </p>
            <Badge state={ticket.status} />
            <p className="small muted">
              {ticket.status === "VALID"
                ? "Pri vstupe predložte tento kód personálu. Je platný pre jedno použitie a patrí len vám."
                : ticket.status === "USED"
                  ? "Táto vstupenka už bola použitá. Opakovaný vstup nie je možný."
                  : "Táto vstupenka bola zneplatnená a nemožno ju použiť na vstup."}
            </p>
            <div
              className="admission-barcode"
              tabIndex={0}
              role="region"
              aria-label="Vstupný čiarový kód v plnej veľkosti"
            >
              <TicketBarcode value={ticket.code} />
            </div>
            <p className="small muted">
              Na menšom displeji otočte telefón na šírku. Personálu môžete
              predložiť aj textový kód.
            </p>
            <code>{ticket.code}</code>
            <button
              className="btn secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(ticket.code);
                  setCopied(true);
                  setCopyError(false);
                } catch {
                  setCopyError(true);
                }
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Skopírované" : "Kopírovať kód"}
            </button>
            {copyError && (
              <p role="status">Kód označte a skopírujte manuálne.</p>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}

import type { Reservation } from "../../shared/api/types";

type Item = Reservation["items"][number];

/** Seats the reservation holds now; for a finished one, the group released last. */
export function currentItems(reservation: Reservation): Item[] {
  const active = reservation.items.filter((item) => !item.released_at);
  if (active.length || !reservation.items.length) return active;
  const releasedAt = (item: Item) => new Date(item.released_at!).getTime();
  const lastItem = reservation.items.reduce((latest, item) =>
    releasedAt(item) > releasedAt(latest) ? item : latest,
  );
  // One statement releases a whole group with the same timestamp text.
  return reservation.items.filter(
    (item) => item.released_at === lastItem.released_at,
  );
}

/** Screening seat IDs the reservation actively holds. */
export function heldSeatIds(reservation: Reservation): string[] {
  return reservation.items
    .filter((item) => !item.released_at)
    .map((item) => item.screening_seat_id);
}

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, api } from "../../shared/api/client";
import type {
  Availability,
  Reservation,
  Screening,
} from "../../shared/api/types";
import { useAsync } from "../../shared/lib/hooks";
import { readGuestToken } from "./guest-session";
import { heldSeatIds } from "./reservation-items";

type SeatChangeData = {
  reservation: Reservation;
  /** Only an unpaid hold loads its seat map; other states show why they are locked. */
  screening: Screening | null;
  availability: Availability | null;
};

const STALE_CODES = [
  "seat_unavailable",
  "invalid_state",
  "reservation_expired",
];

/** Load an unpaid hold with its seat map and replace its seats on save. */
export function useSeatChange(id: string | undefined) {
  const navigate = useNavigate();
  const auth = useMemo(() => {
    const token = id ? readGuestToken(id) : null;
    return token ? { token } : {};
  }, [id]);
  const mounted = useRef(true);
  // Only the newest refresh may write; a save invalidates a poll still in flight.
  const latestRefresh = useRef(0);
  const [picked, setPicked] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();

  async function fetchState(signal?: AbortSignal): Promise<SeatChangeData> {
    const reservation = await api<Reservation>(`/reservations/${id}`, {
      signal,
      ...auth,
    });
    if (reservation.state !== "HELD")
      return { reservation, screening: null, availability: null };
    const screeningPath = `/screenings/${reservation.screening_id}`;
    const [screening, availability] = await Promise.all([
      api<Screening>(screeningPath, { signal }),
      api<Availability>(`${screeningPath}/seats`, { signal }),
    ]);
    return { reservation, screening, availability };
  }

  const data = useAsync((signal) => fetchState(signal), [id]);
  const held = data.value ? heldSeatIds(data.value.reservation) : [];
  const selected = picked ?? held;
  // The hold's own seats are taken for everyone else, but still choosable here.
  const seats = (data.value?.availability?.seats ?? []).map((seat) =>
    held.includes(seat.id) ? { ...seat, available: true } : seat,
  );
  const changed =
    selected.length !== held.length ||
    selected.some((seat) => !held.includes(seat));

  /** Reload the hold and its seat map; keep only picks that are still ours or free. */
  async function refresh() {
    const request = ++latestRefresh.current;
    const next = await fetchState();
    if (!mounted.current || request !== latestRefresh.current) return;
    const nextHeld = heldSeatIds(next.reservation);
    const free = new Set(
      (next.availability?.seats ?? [])
        .filter((seat) => seat.available)
        .map((seat) => seat.id),
    );
    setPicked((current) =>
      current
        ? current.filter((seat) => nextHeld.includes(seat) || free.has(seat))
        : current,
    );
    data.setValue(next);
  }

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const editable = data.value?.reservation.state === "HELD";
  useEffect(() => {
    if (!editable) return;
    const timer = setInterval(() => {
      if (!document.hidden && !busy) refresh().catch(() => {});
    }, 10_000);
    return () => clearInterval(timer);
  }, [id, busy, editable]);

  function toggle(seat: string) {
    setError(undefined);
    setPicked((current) => {
      const base = current ?? held;
      if (base.includes(seat)) return base.filter((s) => s !== seat);
      return base.length < 6 ? [...base, seat] : base;
    });
  }

  async function save() {
    if (busy || !changed || !selected.length) return;
    latestRefresh.current++;
    setBusy(true);
    setError(undefined);
    try {
      await api<Reservation>(`/reservations/${id}`, {
        method: "PUT",
        body: { screening_seat_ids: selected },
        ...auth,
      });
      if (mounted.current) navigate(`/rezervacie/${id}`, { replace: true });
    } catch (e) {
      if (!mounted.current) return;
      setError(e);
      if (!(e instanceof ApiError) || !STALE_CODES.includes(e.code)) return;
      // Paid elsewhere, cancelled or lapsed: forget the attempted seats.
      if (e.code !== "seat_unavailable") setPicked(null);
      await refresh().catch(() => {});
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  return { data, seats, selected, changed, busy, error, toggle, save };
}

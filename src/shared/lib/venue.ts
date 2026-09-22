import type { Screening } from "../api/types";

const technicalHallName =
  /^(?:legacy hall(?:\s+[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})?|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/i;

export function auditoriumLabel(name: string | null | undefined): string {
  const label = name?.trim() || "";
  return technicalHallName.test(label) ? "" : label;
}

export function venueLabel(
  screening: Pick<Screening, "cinema_name" | "auditorium_name">,
): string {
  return [
    screening.cinema_name.trim(),
    auditoriumLabel(screening.auditorium_name),
  ]
    .filter(Boolean)
    .join(" · ");
}

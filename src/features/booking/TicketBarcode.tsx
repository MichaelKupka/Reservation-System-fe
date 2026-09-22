import JsBarcode from "jsbarcode";
import { useMemo } from "react";

export function TicketBarcode({ value }: { value: string }) {
  const barcode = useMemo(() => {
    const result: { encodings?: { data: string }[] } = {};
    try {
      JsBarcode(result, value, { format: "CODE128", displayValue: false });
    } catch {
      return null;
    }
    const pattern = result.encodings?.map((part) => part.data).join("");
    if (!pattern) return null;
    // Preserve a 12-module quiet zone on both sides of the issued payload.
    const path = Array.from(
      pattern.matchAll(/1+/g),
      (run) => `M${run.index + 12} 4h${run[0].length}v56h-${run[0].length}z`,
    ).join(" ");
    return { path, width: pattern.length + 24 };
  }, [value]);

  if (!barcode)
    return <span className="barcode-fallback">Otvoriť vstupný kód</span>;
  return (
    <svg
      className="ticket-barcode"
      viewBox={`0 0 ${barcode.width} 64`}
      width={barcode.width}
      height="64"
      preserveAspectRatio="none"
      role="img"
      aria-label="Čiarový kód vstupenky"
    >
      <rect width={barcode.width} height="64" fill="#fff" />
      <path d={barcode.path} fill="#111" />
    </svg>
  );
}

import { CheckCircle2, ScanLine } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { api } from "../../../shared/api/client";
import type { Ticket } from "../../../shared/api/types";
import { time } from "../../../shared/lib/format";
import { InlineError, Submit } from "../../../shared/ui/index";

export function CheckIn() {
  const [result, setResult] = useState<Ticket | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(undefined);
    setResult(null);
    try {
      const ticket = await api<Ticket>("/tickets/check-in", {
        method: "POST",
        body: { code: code.trim() },
      });
      setResult(ticket);
      setCode("");
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="surface checkin-panel text-center">
      <span className="checkin-icon text-cinema-muted grid">
        <ScanLine size={32} />
      </span>
      <h2>Vitajte pri vstupe.</h2>
      <p className="muted">
        Vložte kód zo vstupenky návštevníka. Vstup je možný od 30 minút pred
        začiatkom premietania.
      </p>
      <form className="form-stack" onSubmit={submit}>
        <InlineError error={error} />
        <label>
          Kód vstupenky
          <input
            name="ticket_code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            minLength={24}
            maxLength={128}
            required
            autoComplete="off"
            spellCheck={false}
            placeholder="Vložte alebo načítajte kód"
          />
        </label>
        <Submit busy={busy}>Overiť a označiť vstup</Submit>
      </form>
      {result && (
        <div className="checkin-success text-cinema-muted" role="status">
          <CheckCircle2 size={32} />
          <h3>Vstup povolený</h3>
          <p>
            Vstupenka bola označená ako použitá. Prajeme príjemný filmový
            zážitok.
          </p>
          <span className="small">
            Overené {result.used_at && time(result.used_at)}
          </span>
        </div>
      )}
    </section>
  );
}

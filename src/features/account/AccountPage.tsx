import { KeyRound, ShieldCheck } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { api, setToken } from "../../shared/api/client";
import { InlineError, PageHeading, Submit } from "../../shared/ui/index";
import { useAuth } from "../auth/auth-context";

export default function Account() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError(undefined);
    if (data.get("new_password") !== data.get("confirm")) {
      setError("Nové heslá sa nezhodujú.");
      return;
    }
    setBusy(true);
    try {
      await api("/auth/change-password", {
        method: "POST",
        body: {
          current_password: data.get("current_password"),
          new_password: data.get("new_password"),
        },
      });
      setToken(null);
      window.location.replace("/prihlasenie?zmenene=1");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container inner-page">
      <PageHeading eyebrow="VÁŠ ÚČET" title="Dobrý deň, filmový fanúšik.">
        Vaše údaje a bezpečnosť prihlásenia.
      </PageHeading>
      <div className="account-layout gap-7.5 grid">
        <section className="surface profile-card text-center">
          <span className="large-avatar text-cinema-muted text-[32px] grid">
            {user?.full_name.slice(0, 1)}
          </span>
          <h2>{user?.full_name}</h2>
          <p className="muted">{user?.email}</p>
          <div className="profile-role text-cinema-muted items-center gap-2 text-[11px] inline-flex">
            <ShieldCheck size={17} />
            {user?.role === "ADMIN"
              ? "Administrátor"
              : user?.role === "MANAGER"
                ? "Manažér kina"
                : "Člen kino klubu"}
          </div>
          <p className="small muted">
            Vaše rezervácie aj vstupenky sú prepojené s týmto účtom.
          </p>
        </section>
        <section className="surface">
          <h2 className="icon-heading items-center gap-[11px] flex">
            <KeyRound size={22} />
            Zmena hesla
          </h2>
          <p className="muted">
            Po zmene hesla vás odhlásime zo všetkých zariadení.
          </p>
          <form onSubmit={submit} className="form-stack">
            <InlineError error={error} />
            <label>
              Aktuálne heslo
              <input
                type="password"
                name="current_password"
                required
                maxLength={128}
                autoComplete="current-password"
              />
            </label>
            <label>
              Nové heslo
              <input
                type="password"
                name="new_password"
                aria-label="Nové heslo"
                aria-describedby="password-help"
                required
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
              />
              <small id="password-help" className="muted">
                Použite aspoň 12 znakov.
              </small>
            </label>
            <label>
              Zopakujte nové heslo
              <input
                type="password"
                name="confirm"
                required
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
              />
            </label>
            <Submit busy={busy}>Uložiť nové heslo</Submit>
          </form>
        </section>
      </div>
    </div>
  );
}

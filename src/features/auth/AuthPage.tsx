import { ArrowRight, ArrowUpRight, Eye, EyeOff } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../shared/api/client";
import { safeNext } from "../../shared/lib/format";
import { InlineError, Notice, Poster, Submit } from "../../shared/ui/index";
import { useAuth } from "./auth-context";

export default function AuthPage() {
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [visible, setVisible] = useState(false);
  if (user) return <Navigate to={next} replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(undefined);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email"));
    const password = String(data.get("password"));
    try {
      if (register)
        await api("/auth/register", {
          method: "POST",
          body: { email, password, full_name: data.get("full_name") },
        });
      await signIn(email, password);
      navigate(next, { replace: true });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout gap-[85px] grid container">
      <div className="auth-art relative">
        <Poster hero />
        <div className="auth-quote">
          <span className="eyebrow light">VÁŠ FILMOVÝ SVET</span>
          <h2>
            Niektoré príbehy
            <br />
            si zaslúžia
            <br />
            <em>veľké plátno.</em>
          </h2>
          <span className="art-index text-cinema-text text-[8px]">
            KINO KLUB / OD PRVÉHO ZÁBERU
          </span>
        </div>
      </div>
      <div className="auth-form-wrap">
        <Link to="/" className="text-link">
          Späť na program <ArrowUpRight size={15} />
        </Link>
        <p className="eyebrow">
          {register ? "ZAČNITE NOVÝ PRÍBEH" : "VITAJTE SPÄŤ"}
        </p>
        <h1>{register ? "Miesto pre vás." : "Váš večer začína tu."}</h1>
        <p className="muted">
          {register
            ? "Vytvorte si účet a majte svoje filmové zážitky na jednom mieste."
            : "Prihláste sa a pokračujte k svojim miestam a vstupenkám."}
        </p>
        {/^\/rezervovat\//.test(next) && (
          <Link className="btn secondary full my-6" to={next}>
            Pokračovať bez prihlásenia <ArrowRight size={18} />
          </Link>
        )}
        <form onSubmit={submit} className="form-stack">
          {params.has("zmenene") && (
            <Notice>Heslo bolo zmenené. Prihláste sa novým heslom.</Notice>
          )}
          <InlineError error={error} />
          {register && (
            <label>
              Vaše meno
              <input
                name="full_name"
                autoComplete="name"
                minLength={2}
                maxLength={120}
                required
                placeholder="Meno a priezvisko"
              />
            </label>
          )}
          <label>
            E-mail
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              placeholder="vas@email.sk"
            />
          </label>
          <label>
            Heslo
            <div className="password-field">
              <input
                name="password"
                type={visible ? "text" : "password"}
                autoComplete={register ? "new-password" : "current-password"}
                minLength={register ? 12 : 1}
                maxLength={128}
                required
                placeholder={register ? "Aspoň 12 znakov" : "Vaše heslo"}
              />
              <button
                type="button"
                className="icon-button"
                onClick={() => setVisible(!visible)}
                aria-label={visible ? "Skryť heslo" : "Zobraziť heslo"}
              >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          <Submit busy={busy}>
            {register ? "Vytvoriť účet" : "Prihlásiť sa"}
            <ArrowRight size={18} />
          </Submit>
        </form>
        <p className="auth-switch text-cinema-muted text-[12px]">
          {register ? "Už máte účet?" : "Ešte nemáte účet?"}{" "}
          <button
            className="text-button"
            onClick={() => {
              setRegister(!register);
              setError(undefined);
            }}
          >
            {register ? "Prihláste sa" : "Zaregistrujte sa"}
          </button>
        </p>
      </div>
    </div>
  );
}

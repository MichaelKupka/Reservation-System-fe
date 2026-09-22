import {
  AlertCircle,
  ArrowRight,
  Check,
  LoaderCircle,
  RefreshCw,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useId, useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { errorText } from "../api/client";
import { stateLabel } from "../lib/format";

export function Loading({
  label = "Pripravujeme pre vás kino…",
}: {
  label?: string;
}) {
  return (
    <div className="loading-state" role="status">
      <LoaderCircle className="spin" size={26} />
      <span>{label}</span>
    </div>
  );
}
export function ErrorState({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <div className="empty-state" role="alert">
      <div className="empty-icon">
        <AlertCircle />
      </div>
      <h2>Niečo sa nepodarilo</h2>
      <p>{errorText(error)}</p>
      {retry && (
        <button className="btn secondary" onClick={retry}>
          <RefreshCw size={16} />
          Skúsiť znova
        </button>
      )}
    </div>
  );
}
export function InlineError({ error }: { error: unknown }) {
  return error ? (
    <div className="notice error" role="alert">
      <AlertCircle size={18} />
      <span>{typeof error === "string" ? error : errorText(error)}</span>
    </div>
  ) : null;
}
export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="notice success" role="status">
      <Check size={18} />
      <span>{children}</span>
    </div>
  );
}
export function Empty({
  title,
  children,
  action = true,
}: {
  title: string;
  children: ReactNode;
  action?: boolean;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <span>k.</span>
      </div>
      <h2>{title}</h2>
      <p>{children}</p>
      {action && (
        <Link className="btn primary" to="/">
          Pozrieť program <ArrowRight size={17} />
        </Link>
      )}
    </div>
  );
}
export function Badge({ state }: { state: string }) {
  return (
    <span className={`badge ${state.toLowerCase()}`}>
      {stateLabel[state] || state}
    </span>
  );
}
export function PageHeading({
  eyebrow,
  title,
  children,
  action,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {children && <p className="muted">{children}</p>}
      </div>
      {action}
    </div>
  );
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  useLayoutEffect(() => {
    const node = dialog.current;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    node?.showModal();
    return () => {
      node?.close();
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby={id}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-content">
        <div className="modal-heading">
          <h2 id={id}>{title}</h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Zavrieť"
          >
            <X />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
export function Submit({
  busy,
  children,
  className = "primary",
}: {
  busy: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button type="submit" className={`btn ${className}`} disabled={busy}>
      {busy ? <LoaderCircle size={17} className="spin" /> : null}
      {busy ? "Chvíľku prosím…" : children}
    </button>
  );
}
export { Poster } from "./Poster";

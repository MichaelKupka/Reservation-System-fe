import type { ReactNode } from "react";
import { Component } from "react";
import { Empty } from "../../shared/ui";
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="container">
        <Empty title="Na chvíľu sa zatiahla opona." action={false}>
          Aplikáciu sa nepodarilo zobraziť. Obnovte stránku a skúste to znova.
        </Empty>
        <button
          className="btn primary"
          onClick={() => window.location.reload()}
        >
          Obnoviť stránku
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}

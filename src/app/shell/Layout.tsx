import {
  ArrowUpRight,
  ChevronDown,
  LogOut,
  Menu,
  Ticket,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/auth-context";
import { InlineError } from "../../shared/ui/index";

export function Layout() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<unknown>();
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
    setError(undefined);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <a className="skip-link" href="#main">
        Preskočiť na obsah
      </a>
      <header
        className={`site-header relative ${location.pathname === "/" || /^\/(rezervovat|rezervacie)\//.test(location.pathname) ? "is-cinematic" : ""}`}
      >
        <div className="header-inner items-center gap-15 flex">
          <Link className="brand" to="/" aria-label="Kino klub, domov">
            <span className="brand-name">
              KINO<span>KLUB</span>
            </span>
            <span className="brand-small">C I N E M A</span>
          </Link>
          <button
            className="icon-button mobile-menu"
            aria-label={open ? "Zavrieť navigáciu" : "Otvoriť navigáciu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
          <nav
            className={`main-nav items-center gap-7 text-[14px] font-medium flex ${open ? "is-open" : ""}`}
            aria-label="Hlavná navigácia"
          >
            <NavLink to="/" end>
              Program
            </NavLink>
            <NavLink to="/navstevy">
              <Ticket size={16} />
              Moje návštevy
            </NavLink>
            <NavLink to="/kina">Naše kiná</NavLink>
            {user && user.role !== "USER" && (
              <NavLink to="/sprava">Správa kina</NavLink>
            )}
          </nav>
          <div className="header-account">
            {user ? (
              <details className="account-menu relative">
                <summary>
                  <span className="avatar text-cinema-text text-[12px] font-bold grid">
                    {user.full_name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="account-name">
                    {user.full_name.split(" ")[0]}
                  </span>
                  <ChevronDown size={14} />
                </summary>
                <div className="account-dropdown gap-3 grid">
                  <span className="muted small">{user.email}</span>
                  <Link
                    to="/ucet"
                    onClick={(event) =>
                      event.currentTarget
                        .closest("details")
                        ?.removeAttribute("open")
                    }
                  >
                    <UserRound size={16} />
                    Môj účet
                  </Link>
                  <button
                    onClick={async () => {
                      try {
                        await signOut();
                      } catch (e) {
                        setError(e);
                      }
                    }}
                  >
                    <LogOut size={16} />
                    Odhlásiť sa
                  </button>
                </div>
              </details>
            ) : (
              <Link to="/prihlasenie" className="btn small primary">
                Prihlásiť sa <ArrowUpRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </header>
      {error && (
        <div className="container">
          <InlineError error={error} />
        </div>
      )}
      <main id="main" className="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container footer-inner items-center gap-[35px] flex">
          <Link className="brand" to="/">
            <span className="brand-name">
              KINO<span>KLUB</span>
            </span>
            <span className="brand-small">C I N E M A</span>
          </Link>
          <p>Veľké plátno. Spoločné zážitky.</p>
          <div>
            <Link to="/">Program</Link>
            <Link to="/kina">
              Nájdite svoje kino <ArrowUpRight size={14} />
            </Link>
          </div>
          <span className="footer-year text-cinema-muted text-[10px]">
            © {new Date().getFullYear()} Kino klub
          </span>
        </div>
      </footer>
    </>
  );
}

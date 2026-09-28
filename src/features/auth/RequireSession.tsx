import type { ReactNode } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { ErrorState, Loading } from "../../shared/ui";
import { readGuestToken } from "../booking/guest-session";
import { useAuth } from "./auth-context";
export function Protected({
  children,
  staff = false,
}: {
  children: ReactNode;
  staff?: boolean;
}) {
  const { user, loading, error, refresh } = useAuth();
  const location = useLocation();
  if (loading) return <Loading />;
  if (error && !user)
    return <ErrorState error={error} retry={() => void refresh()} />;
  if (!user)
    return (
      <Navigate
        to={`/prihlasenie?next=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  if (staff && user.role === "USER") return <Navigate to="/" replace />;
  return children;
}
export function ReservationAccess({ children }: { children: ReactNode }) {
  const { id } = useParams();
  if (id && readGuestToken(id)) return children;
  return <Protected>{children}</Protected>;
}

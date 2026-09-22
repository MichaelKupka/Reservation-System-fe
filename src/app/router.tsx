import { lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { Protected, ReservationAccess } from "../features/auth/RequireSession";
import Programme from "../features/programme/ProgrammePage";
import { Empty } from "../shared/ui";
import { Layout } from "./shell/Layout";
const Auth = lazy(() => import("../features/auth/AuthPage"));
const Booking = lazy(() => import("../features/booking/BookingPage"));
const Checkout = lazy(() => import("../features/booking/CheckoutPage"));
const Visits = lazy(() => import("../features/visits/VisitsPage"));
const Cinemas = lazy(() => import("../features/cinemas/CinemasPage"));
const Account = lazy(() => import("../features/account/AccountPage"));
const Management = lazy(() => import("../features/management/ManagementPage"));

export function AppRouter() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Programme />} />
        <Route path="prihlasenie" element={<Auth />} />
        <Route path="kina" element={<Cinemas />} />
        <Route path="rezervovat/:id" element={<Booking />} />
        <Route
          path="rezervacie/:id"
          element={
            <ReservationAccess>
              <Checkout />
            </ReservationAccess>
          }
        />
        <Route
          path="navstevy"
          element={
            <Protected>
              <Visits />
            </Protected>
          }
        />
        <Route
          path="ucet"
          element={
            <Protected>
              <Account />
            </Protected>
          }
        />
        <Route
          path="sprava"
          element={
            <Protected staff>
              <Management />
            </Protected>
          }
        />
        <Route
          path="*"
          element={
            <div className="container">
              <Empty title="Táto scéna v našom filme nie je.">
                Stránka sa nenašla. Vráťte sa k programu a vyberte si svoj
                príbeh.
              </Empty>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}

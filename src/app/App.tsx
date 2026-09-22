import { Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import { Loading } from "../shared/ui";
import { AuthProvider } from "./providers/AuthProvider";
import { AppRouter } from "./router";
import { ErrorBoundary } from "./shell/ErrorBoundary";
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<Loading />}>
            <AppRouter />
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

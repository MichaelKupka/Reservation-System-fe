import { createContext, useContext } from "react";
import type { User } from "../../shared/api/types";

export interface Auth {
  user: User | null;
  loading: boolean;
  error: unknown;
  refresh: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
export const AuthContext = createContext<Auth | null>(null);
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("Missing authentication context");
  return auth;
}

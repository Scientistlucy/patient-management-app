import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getStoredName, getToken, setAuthSession } from "../api/client";

type AuthState = {
  token: string | null;
  name: string | null;
  login: (token: string, name: string, remember?: boolean) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [name, setName] = useState<string | null>(() => getStoredName());

  const login = useCallback((nextToken: string, nextName: string, remember = true) => {
    setAuthSession(nextToken, nextName, remember);
    setTokenState(nextToken);
    setName(nextName);
  }, []);

  const logout = useCallback(() => {
    setAuthSession(null, null);
    setTokenState(null);
    setName(null);
  }, []);

  const value = useMemo(
    () => ({ token, name, login, logout }),
    [token, name, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

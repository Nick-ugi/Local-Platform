import type { AuthUser } from "@queenstown/shared";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as session from "./session";

type Auth = {
  /** "checking" while the app looks for a stored session when it starts. */
  status: "checking" | "signedIn" | "signedOut";
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /**
   * The place a visitor pressed the heart of before logging in. The heart saves it once they are
   * back, signed in (wireframe m-login, 1).
   */
  pendingFavorite: string | null;
  setPendingFavorite: (slug: string | null) => void;
};

const AuthContext = createContext<Auth | null>(null);

/** The visitor's account for every screen (USER-01, USER-02). */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [pendingFavorite, setPendingFavorite] = useState<string | null>(null);

  useEffect(() => {
    const stop = session.onSessionChange(setUser);
    let gone = false;
    void session.restore().then((restored) => {
      if (!gone) {
        setUser(restored);
        setChecking(false);
      }
    });
    return () => {
      gone = true;
      stop();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setUser(await session.login(email, password));
  }, []);
  const signup = useCallback(async (email: string, password: string) => {
    setUser(await session.signup(email, password));
  }, []);
  const logout = useCallback(() => session.logout(), []);

  const value = useMemo<Auth>(
    () => ({
      status: checking ? "checking" : user ? "signedIn" : "signedOut",
      user,
      login,
      signup,
      logout,
      pendingFavorite,
      setPendingFavorite,
    }),
    [checking, user, login, signup, logout, pendingFavorite],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Auth {
  const auth = useContext(AuthContext);
  if (auth === null) {
    throw new Error("useAuth needs an AuthProvider");
  }
  return auth;
}

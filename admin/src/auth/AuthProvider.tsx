import type { AuthUser } from "@queenstown/shared";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { login, logout, onSessionChange, restore } from "./session";

type Auth = {
  /** "checking" while a reload looks for a stored session. */
  status: "checking" | "signedIn" | "signedOut";
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<Auth | null>(null);

/** The admin's session for every screen. A session that runs out sends the admin back to Log in. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stop = onSessionChange(setUser);
    let gone = false;
    void restore().then((restored) => {
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

  const value: Auth = {
    status: checking ? "checking" : user ? "signedIn" : "signedOut",
    user,
    login: async (email, password) => {
      setUser(await login(email, password));
    },
    logout,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Auth {
  const auth = useContext(AuthContext);
  if (auth === null) {
    throw new Error("useAuth needs an AuthProvider");
  }
  return auth;
}

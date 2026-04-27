import { createContext, useContext, useEffect, useState } from "react";

export type Role = "GUEST" | "ADMIN";

export type User = {
  username: string;
  displayName: string;
  role: Role;
};

type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  role: Role | null;
  isAdmin: boolean;
  isGuest: boolean;
  loginAsGuest: () => Promise<void>;
  loginAsAdmin: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const isAuthenticated = Boolean(user);
  const role = user?.role ?? null;
  const isAdmin = role === "ADMIN";
  const isGuest = role === "GUEST";

  async function loadCurrentUser() {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (!response.ok) {
        setUser(null);
        return;
      }

      const data = await response.json();

      if (data.ok && data.user) {
        setUser(data.user as User);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function loginAsGuest() {
    const response = await fetch("/api/auth/guest", {
      method: "POST",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok || data.ok === false) {
      throw new Error(data.error || "Guest login failed.");
    }

    setUser(data.user as User);
  }

  async function loginAsAdmin(username: string, password: string) {
    if (!username || !password) {
      throw new Error("Username and password are required.");
    }

    const response = await fetch("/api/auth/admin-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    const rawText = await response.text();

    let data;

    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error("Admin login returned an invalid server response.");
    }

    if (!response.ok || data.ok === false) {
      throw new Error(data.error || "Invalid admin credentials.");
    }

    setUser(data.user as User);
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
    }
  }

  useEffect(() => {
    loadCurrentUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isAuthenticated,
        user,
        role,
        isAdmin,
        isGuest,
        loginAsGuest,
        loginAsAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return ctx;
}
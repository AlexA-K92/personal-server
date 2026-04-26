import { createContext, useContext, useState } from "react";

export type Role = "GUEST" | "ADMIN";

export type User = {
  username: string;
  displayName: string;
  role: Role;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  user: User | null;
  role: Role | null;
  isAdmin: boolean;
  isGuest: boolean;
  loginAsGuest: () => void;
  loginAsAdmin: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "personal_server_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem(STORAGE_KEY);

    if (!storedUser) return null;

    try {
      const parsed = JSON.parse(storedUser) as Partial<User>;

      if (!parsed.username || !parsed.displayName || !parsed.role) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return parsed as User;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  });

  const isAuthenticated = Boolean(user);
  const role = user?.role ?? null;
  const isAdmin = role === "ADMIN";
  const isGuest = role === "GUEST";

  function saveUser(nextUser: User) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }

  function loginAsGuest() {
    saveUser({
      username: "guest",
      displayName: "Guest Visitor",
      role: "GUEST",
    });
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
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok || data.ok === false) {
      throw new Error(data.error || "Admin login failed.");
    }

    saveUser(data.user as User);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
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
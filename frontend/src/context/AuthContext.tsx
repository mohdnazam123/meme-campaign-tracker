
"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiRequest, RequestOptions } from "@/lib/api";
import { AuthResponse, Role, SignupResponse, User } from "@/lib/types";

const STORAGE_KEY = "memed_auth";

interface StoredAuth {
  token: string;
  user: User;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (
    name: string,
    email: string,
    password: string,
    role: Role
  ) => Promise<User>;
  logout: () => void;
  authRequest: <T>(
    path: string,
    options?: Omit<RequestOptions, "token">
  ) => Promise<T>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function getHomePath(role: Role): string {
  return role === "brand" ? "/brand" : "/creator";
}

function isStoredAuth(value: unknown): value is StoredAuth {
  if (typeof value !== "object" || value === null) return false;

  const { token, user } = value as {
    token?: unknown;
    user?: unknown;
  };

  if (
    typeof token !== "string" ||
    typeof user !== "object" ||
    user === null
  ) {
    return false;
  }

  const u = user as {
    id?: unknown;
    name?: unknown;
    email?: unknown;
    role?: unknown;
  };

  return (
    typeof u.id === "string" &&
    typeof u.name === "string" &&
    typeof u.email === "string" &&
    (u.role === "brand" || u.role === "creator")
  );
}

function readStoredAuth(): StoredAuth | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    return isStoredAuth(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function saveStoredAuth(auth: StoredAuth): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  } catch {
    // Storage unavailable; the current session can still continue.
  }
}

function clearStoredAuth(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (cancelled) return;
      setAuth(readStoredAuth());
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setAuth(null);
    router.replace("/");
  }, [router]);

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      const data = await apiRequest<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });

      const stored: StoredAuth = {
        token: data.token,
        user: data.user,
      };

      saveStoredAuth(stored);
      setAuth(stored);
      setLoading(false);

      return data.user;
    },
    []
  );

  const signup = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      role: Role
    ): Promise<User> => {
      await apiRequest<SignupResponse>("/api/auth/signup", {
        method: "POST",
        body: { name, email, password, role },
      });

      try {
        return await login(email, password);
      } catch (error) {
        const status = error instanceof ApiError ? error.status : 0;

        throw new ApiError(
          "Account created, but automatic login failed. Please log in.",
          status
        );
      }
    },
    [login]
  );

  const authRequest = useCallback(
    async <T,>(
      path: string,
      options: Omit<RequestOptions, "token"> = {}
    ): Promise<T> => {
      if (!auth) {
        throw new ApiError("Please log in to continue.", 401);
      }

      try {
        return await apiRequest<T>(path, {
          ...options,
          token: auth.token,
        });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          logout();

          throw new ApiError(
            "Your session has expired. Please log in again.",
            401
          );
        }

        throw error;
      }
    },
    [auth, logout]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: auth ? auth.user : null,
      loading,
      login,
      signup,
      logout,
      authRequest,
    }),
    [auth, loading, login, signup, logout, authRequest]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

export function useRequireRole(role: Role): { user: User | null } {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/");
    } else if (user.role !== role) {
      router.replace(getHomePath(user.role));
    }
  }, [loading, user, role, router]);

  return {
    user: !loading && user && user.role === role ? user : null,
  };
}

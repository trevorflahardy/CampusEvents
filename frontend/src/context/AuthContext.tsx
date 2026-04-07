import {
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { api, type User } from "../lib/api";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const initialToken = localStorage.getItem("token");
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(initialToken);
  const [loading, setLoading] = useState(!!initialToken);

  useEffect(() => {
    if (token) {
      api
        .getMe()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem("token");
          setToken(null);
        })
        .finally(() => setLoading(false));
    }
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    localStorage.setItem("token", res.token);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const register = useCallback(
    async (data: {
      netId: string;
      name: string;
      email: string;
      password: string;
      role?: string;
    }) => {
      await api.register(data);
      // Auto-login after registration
      const res = await api.login(data.email, data.password);
      localStorage.setItem("token", res.token);
      setToken(res.token);
      setUser(res.user);
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = !!user;
  const isOrganizer =
    user?.role === "organizer" || user?.role === "admin" || false;
  const isAdmin = user?.role === "admin" || false;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated,
        isOrganizer,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

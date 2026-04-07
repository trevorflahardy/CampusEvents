import { createContext } from "react";
import type { User } from "../lib/api";

export interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: {
        netId: string;
        name: string;
        email: string;
        password: string;
        role?: string;
    }) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isOrganizer: boolean;
    isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);
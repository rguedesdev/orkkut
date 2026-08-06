"use client";

// Imports principais
import { createContext } from "react";
import { useAuth } from "@/hooks/useAuth";

// Tipagem do que o contexto vai fornecer
interface IUserContext {
  userAuthenticated: boolean;

  signIn: (
    email: string,
    password: string,
  ) => Promise<{
    user: { id: string; name: string; email: string };
    token: string;
  }>;

  signUp: (
    name: string,
    username: string,
    email: string,
    password: string,
    confirmPassword: string,
    invitation: string,
  ) => Promise<void>;

  logout: () => void;
}

// Intância do UserContext com valor inicial nulo
const UserContext = createContext<IUserContext | null>(null);

interface IChildren {
  children: React.ReactNode;
}

function UserProvider({ children }: IChildren) {
  const { userAuthenticated, signIn, signUp, logout } = useAuth();

  return (
    <UserContext.Provider value={{ userAuthenticated, signIn, signUp, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export { UserContext, UserProvider };

"use client";

// Imports principais
import { createContext } from "react";
import { useAuth } from "@/hooks/useAuth";
import type {
  RegistrationAccountData,
  RegistrationProfileData,
} from "@/validation/onboarding";

// Tipagem do que o contexto vai fornecer
interface IUserContext {
  userAuthenticated: boolean;
  authenticatedUser: {
    id: string;
    name: string;
    username: string;
    email?: string | null;
    profile?: { avatarImage?: { url: string } | null } | null;
  } | null;

  signIn: (
    login: string,
    password: string,
  ) => Promise<{
    user: { id: string; name: string; username: string; email?: string | null };
    token: string;
  }>;

  completeRegistration: (
    account: RegistrationAccountData,
    profile: Partial<RegistrationProfileData>,
    onboardingToken: string,
  ) => Promise<void>;

  logout: () => void;
}

// Intância do UserContext com valor inicial nulo
const UserContext = createContext<IUserContext | null>(null);

interface IChildren {
  children: React.ReactNode;
}

function UserProvider({ children }: IChildren) {
  const { userAuthenticated, authenticatedUser, signIn, completeRegistration, logout } = useAuth();

  return (
    <UserContext.Provider value={{ userAuthenticated, authenticatedUser, signIn, completeRegistration, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export { UserContext, UserProvider };

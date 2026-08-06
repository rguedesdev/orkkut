"use client";

// Imports principais
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Axios
import api from "@/utils/api";

// Tipagens
import type {
  RegistrationAccountData,
  RegistrationProfileData,
} from "@/validation/onboarding";

type TUser = {
  id: string;
  name: string;
  username: string;
  email?: string | null;
  profile?: { avatarImage?: { url: string } | null } | null;
};
type TAuthPayload = { user: TUser; token: string };

function useAuth() {
  const [userAuthenticated, setUserAuthenticated] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<TUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.defaults.headers.Authorization = `Bearer ${token}`;

      const restoreSession = async () => {
        try {
          const response = await api.post("/graphql", {
            query: `query RestoreSession {
              me {
                id
                name
                username
                email
                profile { avatarImage { url } }
              }
            }`,
          });
          if (response.data.errors?.length || !response.data.data?.me) {
            throw new Error(response.data.errors?.[0]?.message ?? "Sessão inválida.");
          }
          setAuthenticatedUser(response.data.data.me);
          setUserAuthenticated(true);
        } catch (error) {
          console.error("Erro ao restaurar sessão:", error);
          setAuthenticatedUser(null);
          setUserAuthenticated(false);
          localStorage.removeItem("token");
          localStorage.removeItem("userID");
          delete api.defaults.headers.Authorization;
        }
      };

      void restoreSession();
    } else {
      setAuthenticatedUser(null);
      setUserAuthenticated(false);
      delete api.defaults.headers.Authorization;
    }
  }, []);

  // Função de login
  async function signIn(
    login: string,
    password: string,
  ): Promise<TAuthPayload> {
    const mutation = `
    mutation signIn($data: SignInInput!) {
      signIn(data: $data) {
        user {
          id
          name
          username
          email
          profile { avatarImage { url } }
        }
        token
      }
    }
  `;

    const variables = { data: { login, password } };

    try {
      const response = await api.post("/graphql", {
        query: mutation,
        variables,
      });

      const { data, errors } = response.data;

      // 💥 TRATA ERRO DO GRAPHQL (esse era o problema)
      if (errors?.length) {
        throw new Error(errors[0].message);
      }

      // 💥 GARANTE QUE DATA EXISTE
      if (!data || !data.signIn) {
        throw new Error("Resposta inválida do servidor");
      }

      const signInData: TAuthPayload = data.signIn;

      // 💥 VALIDA PAYLOAD
      if (!signInData.token || !signInData.user) {
        throw new Error("Credenciais inválidas");
      }

      // autentica
      authUser(signInData); // não precisa de await

      return signInData;
    } catch (err) {
      console.error("Erro no login:", err);
      throw err; // não autentica, apenas propaga o erro
    }
  }

  async function completeRegistration(
    account: RegistrationAccountData,
    profile: Partial<RegistrationProfileData>,
    onboardingToken: string,
  ) {
    try {
      const mutation = `
        mutation CompleteRegistration(
          $account: RegistrationAccountInput!
          $profile: ProfileInput
          $onboardingToken: String!
        ) {
          completeRegistration(
            account: $account
            profile: $profile
            onboardingToken: $onboardingToken
          ) {
            user {
              id
              name
              username
              email
              profile { avatarImage { url } }
            }
            token
          }
        }
    `;

      const { avatarImage, ...profileFields } = profile;
      const variables = {
        account,
        profile: {
          ...profileFields,
          avatarImageID: avatarImage?.id ?? null,
        },
        onboardingToken,
      };

      const response = await api.post("/graphql", {
        query: mutation,
        variables,
      });

      const { data, errors } = response.data;

      if (errors?.length) {
        throw new Error(errors[0].message);
      }

      const authPayload: TAuthPayload = data.completeRegistration;

      if (!authPayload?.token || !authPayload?.user) {
        throw new Error("Resposta inválida do servidor");
      }

      await authUser(authPayload);
    } catch (err) {
      console.error("Erro no login:", err);
      throw err;
    }
  }

  async function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userID");
    localStorage.setItem("theme", "light");
    delete api.defaults.headers.Authorization;
    setAuthenticatedUser(null);
    setUserAuthenticated(false);
    router.replace("/");
  }

  // Configura autenticação local e Axios
  async function authUser(data: TAuthPayload) {
    setAuthenticatedUser(data.user);
    setUserAuthenticated(true);

    // Salva token localStorage
    localStorage.setItem("token", data.token);

    // Configura Axios para enviar token em futuras requisições
    api.defaults.headers.Authorization = `Bearer ${data.token}`;

    const userID = data.user.id;

    // Salva o userID no localStorage
    localStorage.setItem("userID", userID);

    // Redireciona para a página do usuário
    router.replace(`/profile/${encodeURIComponent(data.user.username)}`);
  }

  return {
    userAuthenticated,
    authenticatedUser,
    signIn,
    completeRegistration,
    logout,
  };
}

export { useAuth };

import jwt from "jsonwebtoken";

type OnboardingTokenPayload = {
  kind: "onboarding";
  id: string;
  username: string;
  email: string;
  invitation: string;
};

const createOnboardingToken = (payload: Omit<OnboardingTokenPayload, "kind">) =>
  jwt.sign({ ...payload, kind: "onboarding" }, process.env.JWT_SECRET as string, {
    expiresIn: "30m",
  });

const verifyOnboardingToken = (token: string): OnboardingTokenPayload => {
  const payload = jwt.verify(token, process.env.JWT_SECRET as string);
  if (
    typeof payload !== "object" ||
    payload.kind !== "onboarding" ||
    typeof payload.id !== "string" ||
    typeof payload.username !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.invitation !== "string"
  ) {
    throw new Error("Sessão de cadastro inválida.");
  }
  return payload as OnboardingTokenPayload;
};

export { createOnboardingToken, verifyOnboardingToken };
export type { OnboardingTokenPayload };

const profileValueLabels: Record<string, string> = {
  MAN: "Homem",
  WOMAN: "Mulher",
  NON_BINARY: "Não-binário",
  OTHER: "Outro",
  UNDISCLOSED: "Prefiro não informar",
  SINGLE: "Solteiro",
  DATING: "Namorando",
  ENGAGED: "Noivo",
  MARRIED: "Casado",
  CIVIL_UNION: "União estável",
  OPEN_RELATIONSHIP: "Relacionamento aberto",
  SEPARATED: "Separado",
  DIVORCED: "Divorciado",
  WIDOWED: "Viúvo",
  COMPLICATED: "É complicado",
  NONE: "Não tenho",
  HAVE: "Tenho",
  WANT: "Quero ter",
  DO_NOT_WANT: "Não quero ter",
  HETEROSEXUAL: "Heterossexual",
  HOMOSEXUAL: "Homossexual",
  BISEXUAL: "Bissexual",
  PANSEXUAL: "Pansexual",
  ASEXUAL: "Assexual",
  NO: "Não",
  YES: "Sim",
  OCCASIONALLY: "Ocasionalmente",
  QUITTING: "Tentando parar",
  SOCIALLY: "Socialmente",
  FREQUENTLY: "Frequentemente",
};

const profileSelectOptions = {
  gender: [
    ["MAN", "Homem"], ["WOMAN", "Mulher"], ["NON_BINARY", "Não-binário"],
    ["OTHER", "Outro"], ["UNDISCLOSED", "Prefiro não informar"],
  ],
  relationshipStatus: [
    ["SINGLE", "Solteiro"], ["DATING", "Namorando"], ["ENGAGED", "Noivo"],
    ["MARRIED", "Casado"], ["CIVIL_UNION", "União estável"],
    ["OPEN_RELATIONSHIP", "Relacionamento aberto"], ["SEPARATED", "Separado"],
    ["DIVORCED", "Divorciado"], ["WIDOWED", "Viúvo"],
    ["COMPLICATED", "É complicado"], ["UNDISCLOSED", "Prefiro não informar"],
  ],
  childrenStatus: [
    ["NONE", "Não tenho"], ["HAVE", "Tenho"], ["WANT", "Quero ter"],
    ["DO_NOT_WANT", "Não quero ter"], ["UNDISCLOSED", "Prefiro não informar"],
  ],
  sexualOrientation: [
    ["HETEROSEXUAL", "Heterossexual"], ["HOMOSEXUAL", "Homossexual"],
    ["BISEXUAL", "Bissexual"], ["PANSEXUAL", "Pansexual"],
    ["ASEXUAL", "Assexual"], ["OTHER", "Outro"],
    ["UNDISCLOSED", "Prefiro não informar"],
  ],
  smokingStatus: [
    ["NO", "Não"], ["OCCASIONALLY", "Ocasionalmente"], ["YES", "Sim"],
    ["QUITTING", "Tentando parar"], ["UNDISCLOSED", "Prefiro não informar"],
  ],
  drinkingStatus: [
    ["NO", "Não"], ["SOCIALLY", "Socialmente"], ["OCCASIONALLY", "Ocasionalmente"],
    ["FREQUENTLY", "Frequentemente"], ["UNDISCLOSED", "Prefiro não informar"],
  ],
} as const;

const visibilityOptions = [
  ["PUBLIC", "Público"],
  ["AUTHENTICATED", "Usuários autenticados"],
  ["FRIENDS", "Amigos"],
  ["PRIVATE", "Somente eu"],
] as const;

const defaultProfileVisibility = {
  avatar: "PUBLIC",
  profilePhrase: "PUBLIC",
  about: "PUBLIC",
  age: "PUBLIC",
  birthDate: "PRIVATE",
  gender: "PUBLIC",
  country: "PUBLIC",
  city: "AUTHENTICATED",
  relationshipStatus: "AUTHENTICATED",
  childrenStatus: "AUTHENTICATED",
  sexualOrientation: "PRIVATE",
  smokingStatus: "AUTHENTICATED",
  drinkingStatus: "AUTHENTICATED",
  interests: "PUBLIC",
  passions: "PUBLIC",
  sports: "PUBLIC",
  activities: "PUBLIC",
  socialFans: "PUBLIC",
  socialCool: "PUBLIC",
  socialSexy: "PUBLIC",
  socialTrustworthy: "PUBLIC",
} as const;

const visibilityFieldLabels: Record<keyof typeof defaultProfileVisibility, string> = {
  avatar: "Foto de perfil",
  profilePhrase: "Frase do perfil",
  about: "Quem sou eu",
  age: "Idade",
  birthDate: "Data completa de nascimento",
  gender: "Gênero",
  country: "País e região",
  city: "Cidade",
  relationshipStatus: "Relacionamento",
  childrenStatus: "Filhos",
  sexualOrientation: "Orientação sexual",
  smokingStatus: "Fumo",
  drinkingStatus: "Bebida",
  interests: "Interesses",
  passions: "Paixões",
  sports: "Esportes",
  activities: "Atividades",
  socialFans: "Quantidade de fãs",
  socialCool: "Qualificação Legal",
  socialSexy: "Qualificação Sexy",
  socialTrustworthy: "Qualificação Confiável",
};

function getProfileValueLabel(value?: string | null) {
  if (!value) return null;
  return profileValueLabels[value] ?? value;
}

function formatProfileDate(value?: string | null) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

export {
  defaultProfileVisibility,
  formatProfileDate,
  getProfileValueLabel,
  profileSelectOptions,
  profileValueLabels,
  visibilityFieldLabels,
  visibilityOptions,
};

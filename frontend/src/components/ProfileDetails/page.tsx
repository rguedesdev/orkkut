"use client";

import { useEffect, useState } from "react";
import { BsBox, BsFillBoxFill } from "react-icons/bs";
import { FaRegSmileBeam, FaSmileBeam } from "react-icons/fa";
import { GoStarFill } from "react-icons/go";
import { IoHeart, IoHeartOutline } from "react-icons/io5";
import { RiArrowRightWideLine } from "react-icons/ri";

import type {
  ProfileRatingSummary,
  ProfileSocialInteractions,
  ProfileUser,
} from "@/types/profile";
import api from "@/utils/api";
import { formatProfileDate, getProfileValueLabel } from "@/utils/profile-labels";
import styles from "./profiledetails.module.css";

type RatingCategory = "COOL" | "SEXY" | "TRUSTWORTHY";

function ProfileDetailsComponent({ user }: { user: ProfileUser }) {
  const profile = user.profile;
  const [social, setSocial] = useState<ProfileSocialInteractions>(user.socialInteractions);
  const [interactionLoading, setInteractionLoading] = useState<string | null>(null);
  const [interactionError, setInteractionError] = useState<string | null>(null);
  const [ratingPreview, setRatingPreview] = useState<Partial<Record<RatingCategory, number>>>({});

  useEffect(() => setSocial(user.socialInteractions), [user.socialInteractions]);

  const rows = [
    ["Quem sou eu", profile?.about],
    ["Data de nascimento", formatProfileDate(profile?.birthDate)],
    ["Idade", profile?.age != null ? `${profile.age} anos` : null],
    ["Interesses", profile?.interests?.join(", ")],
    ["Relacionamento", getProfileValueLabel(profile?.relationshipStatus)],
    ["Filhos", getProfileValueLabel(profile?.childrenStatus)],
    ["Orientação sexual", profile?.customSexualOrientation || getProfileValueLabel(profile?.sexualOrientation)],
    ["Fumo", getProfileValueLabel(profile?.smokingStatus)],
    ["Bebo", getProfileValueLabel(profile?.drinkingStatus)],
    ["Paixões", profile?.passions?.map((item) => item.name).join(", ")],
    ["Esportes", profile?.sports?.map((item) => item.name).join(", ")],
    ["Atividades", profile?.activities?.join(", ")],
  ].filter((row) => row[1]);

  const socialMutation = async (
    key: string,
    query: string,
    variables: Record<string, unknown>,
    responseField: string,
  ) => {
    if (interactionLoading) return;
    setInteractionLoading(key);
    setInteractionError(null);
    try {
      const response = await api.post("/graphql", { query, variables });
      if (response.data.errors?.length) throw new Error(response.data.errors[0].message);
      setSocial(response.data.data[responseField]);
    } catch (error) {
      setInteractionError(error instanceof Error ? error.message : "Não foi possível salvar a interação.");
    } finally {
      setInteractionLoading(null);
    }
  };

  const toggleFan = () => socialMutation(
    "FAN",
    social.viewerIsFan
      ? `mutation($targetUserID: ID!) { removeProfileFan(targetUserID: $targetUserID) { ${socialSelection} } }`
      : `mutation($targetUserID: ID!) { becomeProfileFan(targetUserID: $targetUserID) { ${socialSelection} } }`,
    { targetUserID: user.id },
    social.viewerIsFan ? "removeProfileFan" : "becomeProfileFan",
  );

  const rate = (category: RatingCategory, value: number, currentValue?: number | null) => {
    const remove = currentValue === value;
    return socialMutation(
      category,
      remove
        ? `mutation($data: RemoveProfileRatingInput!) { removeProfileRating(data: $data) { ${socialSelection} } }`
        : `mutation($data: SetProfileRatingInput!) { setProfileRating(data: $data) { ${socialSelection} } }`,
      { data: remove ? { targetUserID: user.id, category } : { targetUserID: user.id, category, value } },
      remove ? "removeProfileRating" : "setProfileRating",
    );
  };

  const ratingIcons = (
    category: RatingCategory,
    summary: ProfileRatingSummary,
    icon: (filled: boolean) => React.ReactNode,
  ) => {
    const visualLevel = summary.viewerValue ?? Math.round(summary.average ?? 0);
    return [1, 2, 3].map((level) => {
      const filled = level <= visualLevel;
      const previewFilled = !filled && level <= (ratingPreview[category] ?? 0);
      const content = icon(filled);
      if (!social.viewerCanInteract) return <span key={level}>{content}</span>;
      const selected = summary.viewerValue === level;
      return (
        <button
          key={level}
          type="button"
          className={`${styles.ratingButton} ${!filled ? styles.ratingButtonUnfilled : ""} ${previewFilled ? styles.ratingButtonPreview : ""}`}
          disabled={Boolean(interactionLoading)}
          aria-label={selected ? `Remover avaliação nível ${level}` : `Avaliar com nível ${level}`}
          aria-pressed={selected}
          title={selected ? "Clique novamente para remover" : `Nível ${level}`}
          onClick={() => rate(category, level, summary.viewerValue)}
          onMouseEnter={() => setRatingPreview((current) => ({ ...current, [category]: level }))}
          onMouseLeave={() => setRatingPreview((current) => ({ ...current, [category]: undefined }))}
          onFocus={() => setRatingPreview((current) => ({ ...current, [category]: level }))}
          onBlur={() => setRatingPreview((current) => ({ ...current, [category]: undefined }))}
        >
          {filled ? content : (
            <>
              <span className={styles.ratingDefaultIcon}>{icon(false)}</span>
              <span className={styles.ratingHoverIcon}>{icon(true)}</span>
            </>
          )}
        </button>
      );
    });
  };

  return (
    <section>
      <div className={styles.profileDetailsContainer}>
        <div className={styles.breadcrumbs}>
          <span>Home</span>
          <RiArrowRightWideLine className={styles.breadcrumbsIcon} size={20} />
          <span className={styles.breadcrumbsAactive}>Perfil</span>
        </div>

        <h1 className={styles.profileDetailsNameUsername}>{user.name}</h1>

        <blockquote className={styles.thoughts}>
          {profile?.profilePhrase
            ? <>&quot;{profile.profilePhrase}&quot;</>
            : <>&quot;Vivendo e aprendendo!&quot; - Oe Kintaro.</>}
        </blockquote>

        <ul className={styles.attributesContainer}>
          <li className={styles.attributeContainer}>
            <h2 className={styles.attributeTitle}>Fãs</h2>
            <div className={styles.attributeInfo}>
              {social.viewerCanInteract ? (
                <button
                  className={styles.ratingButton}
                  type="button"
                  disabled={Boolean(interactionLoading)}
                  aria-label={social.viewerIsFan ? "Deixar de ser fã" : "Tornar-se fã"}
                  aria-pressed={social.viewerIsFan}
                  title={social.viewerIsFan ? "Deixar de ser fã" : "Tornar-se fã"}
                  onClick={toggleFan}
                >
                  <GoStarFill className={styles.fansAttributeIcon} size={22} />
                </button>
              ) : (
                <GoStarFill className={styles.fansAttributeIcon} size={22} />
              )}
              <span>{social.fansVisible ? social.fanCount ?? 0 : "Privado"}</span>
            </div>
          </li>

          <li className={styles.attributeContainer}>
            <h2 className={styles.attributeTitle}>Confiável</h2>
            <div className={styles.attributeInfo}>
              {ratingIcons("TRUSTWORTHY", social.trustworthy, (filled) => filled
                ? <FaSmileBeam className={styles.trustedAttributeIcon} size={22} />
                : <FaRegSmileBeam className={styles.trustedAttributeIcon} size={22} />)}
            </div>
          </li>

          <li className={styles.attributeContainer}>
            <h2 className={styles.attributeTitle}>Legal</h2>
            <div className={styles.attributeInfo}>
              {ratingIcons("COOL", social.legal, (filled) => filled
                ? <BsFillBoxFill className={styles.coolAttributeIcon} size={22} />
                : <BsBox className={styles.coolAttributeIcon} size={22} />)}
            </div>
          </li>

          <li className={styles.attributeContainer}>
            <h2 className={styles.attributeTitle}>Sexy</h2>
            <div className={styles.attributeInfoSexy}>
              {ratingIcons("SEXY", social.sexy, (filled) => filled
                ? <IoHeart className={styles.sexyAttributeIcon} size={25} />
                : <IoHeartOutline className={styles.sexyAttributeIcon} size={25} />)}
            </div>
          </li>
        </ul>

        {!social.viewerIsProfileOwner && !social.viewerCanInteract && user.relationship.status !== "BLOCKED_BY_VIEWER" && user.relationship.status !== "BLOCKED_BY_USER" && (
          <p>Somente amigos podem avaliar este perfil.</p>
        )}
        {interactionError && <p role="alert">{interactionError}</p>}

        {rows.length ? (
          <dl className={styles.userInfoExtendedContainer}>
            {rows.map(([label, value]) => <div className={styles.infoPair} key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        ) : <p>Este perfil ainda não foi preenchido.</p>}
      </div>
    </section>
  );
}

const socialSelection = `
  fansVisible fanCount viewerIsFan viewerCanInteract viewerIsProfileOwner viewerIsFriend
  legal { visible count average percentage level1Count level2Count level3Count viewerValue }
  sexy { visible count average percentage level1Count level2Count level3Count viewerValue }
  trustworthy { visible count average percentage level1Count level2Count level3Count viewerValue }
`;

export { ProfileDetailsComponent };

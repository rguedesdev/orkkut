"use client";

// Imports Principais
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

// Style Sheet CSS
import styles from "./basicinfo.module.css";

// Components
import { FiMapPin } from "react-icons/fi";

import { BiEdit } from "react-icons/bi";
import {
  MdPersonOutline,
  MdPersonAddAlt,
  MdOutlinePermMedia,
} from "react-icons/md";
import { HiOutlineMail } from "react-icons/hi";
import { IoVideocamOutline } from "react-icons/io5";
import { TbMessage } from "react-icons/tb";
import { IoGameControllerOutline } from "react-icons/io5";
import { BsBan } from "react-icons/bs";
import { BiMessageSquareDots } from "react-icons/bi";

// Images
import Kon from "../../../public/kon.jpg";
import type { ProfileSocialInteractions, ProfileUser, UserRelationship } from "@/types/profile";
import { getProfileValueLabel } from "@/utils/profile-labels";
import api from "@/utils/api";

function BasicInfoComponent({
  user,
  isOwnProfile = false,
  onRelationshipChange,
  scrapCount,
}: {
  user: ProfileUser;
  isOwnProfile?: boolean;
  onRelationshipChange?: (
    relationship: UserRelationship,
    socialInteractions: ProfileSocialInteractions,
  ) => void;
  scrapCount?: number;
}) {
  const profile = user.profile;
  const location = [profile?.city, profile?.region, profile?.countryCode].filter(Boolean).join(", ");
  const gender = profile?.customGender || getProfileValueLabel(profile?.gender);
  const relationshipStatus = getProfileValueLabel(profile?.relationshipStatus);
  const personalDetails = [gender, relationshipStatus].filter(Boolean).join(", ");
  const [relationship, setRelationship] = useState(user.relationship);
  const [relationshipLoading, setRelationshipLoading] = useState(false);
  const [relationshipError, setRelationshipError] = useState<string | null>(null);

  useEffect(() => setRelationship(user.relationship), [user.relationship]);

  const refreshRelationship = async () => {
    const response = await api.post("/graphql", {
      query: `query RelationshipWith($userID: ID!, $username: String!) {
        relationshipWith(userID: $userID) {
          status targetUserID requestID canSendRequest canAcceptRequest canDeclineRequest
          canCancelRequest canRemoveFriend canBlock canUnblock viewerIsFriend viewerIsProfileOwner
        }
        user(username: $username) {
          socialInteractions {
            fansVisible fanCount viewerIsFan viewerCanInteract viewerIsProfileOwner viewerIsFriend
            legal { visible count average percentage level1Count level2Count level3Count viewerValue }
            sexy { visible count average percentage level1Count level2Count level3Count viewerValue }
            trustworthy { visible count average percentage level1Count level2Count level3Count viewerValue }
          }
        }
      }`,
      variables: { userID: user.id, username: user.username },
    });
    if (response.data.errors?.length) throw new Error(response.data.errors[0].message);
    const nextRelationship = response.data.data.relationshipWith as UserRelationship;
    const nextSocial = response.data.data.user.socialInteractions as ProfileSocialInteractions;
    setRelationship(nextRelationship);
    onRelationshipChange?.(nextRelationship, nextSocial);
  };

  const relationshipAction = async (
    query: string,
    variables: Record<string, string>,
    confirmation?: string,
  ) => {
    if (relationshipLoading || (confirmation && !window.confirm(confirmation))) return;
    setRelationshipLoading(true);
    setRelationshipError(null);
    try {
      const response = await api.post("/graphql", { query, variables });
      if (response.data.errors?.length) throw new Error(response.data.errors[0].message);
      await refreshRelationship();
    } catch (error) {
      setRelationshipError(error instanceof Error ? error.message : "Não foi possível atualizar a relação.");
    } finally {
      setRelationshipLoading(false);
    }
  };

  const requestID = relationship?.requestID ?? "";
  return (
    <section>
      <div className={styles.basicInfoContainer}>
        <div className={styles.profileBorder}>
          <Image
            className={styles.profileImage}
            src={profile?.avatarImage?.url ?? Kon}
            alt="Profile Image"
            width={200}
            height={200}
            priority
            unoptimized={Boolean(profile?.avatarImage?.url)}
          />
        </div>

        <div className={styles.personalInfo}>
          <h1 className={styles.basicInfoNameUsername}>@{user.username}</h1>
          <p className={styles.genderMaritalStatus}>
            {personalDetails || "Perfil em construção"}
          </p>
          <p className={styles.stateCountry}>
            <FiMapPin size={15} />
            <span>{location || "Localização não informada"}</span>
          </p>
        </div>

        <hr className={styles.hrFaded} />

        <div className={styles.linksContainer}>
          {isOwnProfile && (
            <Link className={styles.link} href={`/profile/${encodeURIComponent(user.username)}/edit`}>
              <BiEdit size={22} />
              <span>Editar perfil</span>
            </Link>
          )}
          {!isOwnProfile && relationship?.canSendRequest && (
            <button className={styles.link} type="button" disabled={relationshipLoading} onClick={() => relationshipAction(
              `mutation($targetUserID: ID!) { sendFriendRequest(targetUserID: $targetUserID) { id } }`,
              { targetUserID: user.id },
            )}>
              <MdPersonAddAlt size={25} /><span>Adicionar amigo</span>
            </button>
          )}
          {!isOwnProfile && relationship?.status === "REQUEST_SENT" && (
            <button className={styles.link} type="button" disabled={relationshipLoading} onClick={() => relationshipAction(
              `mutation($requestID: ID!) { cancelFriendRequest(requestID: $requestID) { id } }`,
              { requestID },
            )}>
              <MdPersonAddAlt size={25} /><span>Cancelar solicitação</span>
            </button>
          )}
          {!isOwnProfile && relationship?.status === "REQUEST_RECEIVED" && (
            <>
              <button className={styles.link} type="button" disabled={relationshipLoading} onClick={() => relationshipAction(
                `mutation($requestID: ID!) { acceptFriendRequest(requestID: $requestID) { id } }`,
                { requestID },
              )}>
                <MdPersonAddAlt size={25} /><span>Aceitar amizade</span>
              </button>
              <button className={styles.link} type="button" disabled={relationshipLoading} onClick={() => relationshipAction(
                `mutation($requestID: ID!) { declineFriendRequest(requestID: $requestID) { id } }`,
                { requestID },
              )}>
                <BsBan size={20} /><span>Recusar solicitação</span>
              </button>
            </>
          )}
          {!isOwnProfile && relationship?.status === "FRIENDS" && (
            <button className={styles.link} type="button" disabled={relationshipLoading} onClick={() => relationshipAction(
              `mutation($userID: ID!) { removeFriend(userID: $userID) { status } }`,
              { userID: user.id },
              "Remover esta amizade? Fãs e qualificações entre vocês também serão removidos.",
            )}>
              <MdPersonAddAlt size={25} /><span>Amigos — remover</span>
            </button>
          )}
          {!isOwnProfile && relationship?.canBlock && (
            <button className={styles.link} type="button" disabled={relationshipLoading} onClick={() => relationshipAction(
              `mutation($userID: ID!) { blockUser(userID: $userID) { status } }`,
              { userID: user.id },
              "Bloquear este usuário? A amizade e todas as interações entre vocês serão removidas.",
            )}>
              <BsBan size={20} /><span>Bloquear usuário</span>
            </button>
          )}
          {!isOwnProfile && relationship?.canUnblock && (
            <button className={styles.link} type="button" disabled={relationshipLoading} onClick={() => relationshipAction(
              `mutation($userID: ID!) { unblockUser(userID: $userID) { status } }`,
              { userID: user.id },
            )}>
              <BsBan size={20} /><span>Desbloquear usuário</span>
            </button>
          )}
          {!isOwnProfile && relationship?.status === "BLOCKED_BY_USER" && <span>Este usuário bloqueou interações com você.</span>}
          {relationshipLoading && <span>Atualizando relação…</span>}
          {relationshipError && <span role="alert">{relationshipError}</span>}

          <hr className={styles.hrFaded} />

          <Link className={styles.link} href={isOwnProfile
            ? `/profile/${encodeURIComponent(user.username)}`
            : `/user/${encodeURIComponent(user.username)}`}
          >
            <MdPersonOutline size={25} />
            <span>Perfil</span>
          </Link>

          <Link className={styles.link} href={isOwnProfile
            ? `/profile/${encodeURIComponent(user.username)}/scraps`
            : `/user/${encodeURIComponent(user.username)}/scraps`}
          >
            <HiOutlineMail size={22} />
            <span>Scraps{typeof scrapCount === "number" ? ` (${scrapCount})` : ""}</span>
          </Link>

          <Link href={`/`} className={styles.link}>
            <BiMessageSquareDots size={22} />
            <span>Chat</span>
          </Link>

          <Link className={styles.link} href={`/`}>
            <MdOutlinePermMedia size={22} />
            <span>Fotos (12)</span>
          </Link>

          <Link className={styles.link} href={`/`}>
            <IoVideocamOutline size={25} />
            <span>Vídeos (2)</span>
          </Link>

          <Link className={styles.link} href={`/`}>
            <TbMessage size={22} />
            <span>Depoimentos (2)</span>
          </Link>

          <Link className={styles.link} href={`/`}>
            <IoGameControllerOutline size={22} />
            <span>Jogos (2)</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export { BasicInfoComponent };

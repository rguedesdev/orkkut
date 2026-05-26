// Imports Principais
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";

// Style Sheet CSS
import styles from "./communitybasicinfo.module.css";

// Components
import { MdOutlinePeopleAlt, MdOutlineForum } from "react-icons/md";
import { CgPoll } from "react-icons/cg";
import { RiUserCommunityLine, RiVipCrownLine } from "react-icons/ri";
import { AiOutlineStop } from "react-icons/ai";
import { GoCircleSlash } from "react-icons/go";
import { IoCloseCircleOutline } from "react-icons/io5";
import { RiCloseCircleLine } from "react-icons/ri";
import { FaTheaterMasks } from "react-icons/fa";
import { AiOutlineFileText } from "react-icons/ai";
import { RiMegaphoneLine } from "react-icons/ri";
import { BsGear } from "react-icons/bs";

// Images
import EuOdeio from "../../../public/eu_odeio2.png";
import api from "@/utils/api";

function CommunityBasicInfoComponent({ community, owner, setCommunity }) {
  console.log("Dados da comunidade", community);
  console.log("É o Proprietário?", owner);

  // === NOVO: DESCOBRE SE O USUÁRIO LOGADO JÁ É MEMBRO ===
  const loggedUserId =
    typeof window !== "undefined" ? localStorage.getItem("userID") : null;

  // Limpa as aspas do ID se o seu localstorage salvar com aspas
  const cleanLoggedUserId = loggedUserId
    ? String(loggedUserId).trim().replace(/[\\"]/g, "")
    : null;

  // Verifica na membersList se existe algum 'item.user.id' igual ao ID logado
  const isMember =
    community?.membersList?.some((item) => {
      const memberId = String(item.user.id).trim().replace(/[\\"]/g, "");
      return memberId === cleanLoggedUserId;
    }) || false;

  const [isLoadingAction, setIsLoadingAction] = useState(false);

  async function handleJoin() {
    if (isLoadingAction) return; // Se já tiver clicado, ignora o segundo clique

    try {
      setIsLoadingAction(true); // Trava o clique

      const token = localStorage.getItem("token");

      const response = await api.post(
        "/graphql",
        {
          query: `
            mutation JoinCommunity($communityID: ID!) {
                joinCommunity(communityID: $communityID) {
                    id
                    members
                    membersList {
                        role
                        user {
                            id
                            name
                        }
                    }
                }
            }
        `,
          variables: { communityID: community.id },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.errors) {
        toast.error(response.data.errors[0].message);
        // alert(response.data.errors[0].message);
        return;
      }

      const updatedData = response.data.data.joinCommunity;

      if (setCommunity) {
        setCommunity((prev) => ({
          ...prev,
          members: updatedData.members,
          membersList: updatedData.membersList,
        }));
      }

      toast.success("Você entrou na comunidade!");
    } catch (error) {
      console.error("Erro ao entrar na comunidade:", error);
    } finally {
      setIsLoadingAction(false); // Libera o clique quando tudo terminar
    }
  }

  async function handleLeave() {
    if (isLoadingAction) return; // Se já tiver clicado, ignora o segundo clique

    try {
      setIsLoadingAction(true); // Trava o clique

      const token = localStorage.getItem("token");

      const response = await api.post(
        "/graphql",
        {
          query: `
          mutation LeaveCommunity($communityID: ID!) {
              leaveCommunity(communityID: $communityID) {
                  id
                  members        
                  membersList {  
                      role
                      user {
                          id
                          name
                      }
                  }
              }
          }
        `,
          variables: { communityID: community.id },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.errors) {
        toast.error(response.data.errors[0].message);
        return;
      }

      const updatedData = response.data.data.leaveCommunity;

      if (setCommunity && updatedData) {
        setCommunity((prev) => ({
          ...prev,
          members: updatedData.members,
          membersList: updatedData.membersList,
        }));
      }

      toast.info("Você saiu da comunidade!");
    } catch (error) {
      console.error("Erro ao sair da comunidade:", error);
    } finally {
      setIsLoadingAction(false); // Libera o clique quando tudo terminar
    }
  }

  return (
    <section>
      <div className={styles.communityBasicInfoContainer}>
        <div className={styles.pictureBorder}>
          <Image
            className={styles.communityPicture}
            src={EuOdeio}
            alt="Profile Image"
            width={200}
            height={200}
            priority
          />
        </div>

        <div className={styles.communityInfo}>
          <p className={styles.communityMembers}>
            <MdOutlinePeopleAlt size={22} />
            <span>
              {community?.members <= 1
                ? `${community?.members || 0} membro`
                : `${community?.members || 0} membros`}
            </span>
          </p>
        </div>

        <hr className={styles.communityHrFaded} />

        <div className={styles.communityLinksContainer}>
          <Link className={styles.communityLink} href={`/`}>
            <MdOutlineForum size={22} />
            <span>Fórum</span>
          </Link>

          <Link className={styles.communityLink} href={`/`}>
            <CgPoll size={22} />
            <span>Enquetes</span>
          </Link>

          <Link className={styles.communityLink} href={`/`}>
            <FaTheaterMasks size={22} />
            <span>Eventos</span>
          </Link>

          <Link className={styles.communityLink} href={`/`}>
            <AiOutlineFileText size={22} />
            <span>Regras</span>
          </Link>
        </div>

        <hr className={styles.communityHrFaded} />

        <div className={styles.communityLinksActions}>
          <h2 className={styles.actionTitle}>Ações</h2>

          {/* Se NÃO for o proprietário, mostra as opções dinamicamente baseadas em ser membro ou não */}
          {!owner && (
            <>
              {/* CORRIGIDO: Só mostra o botão de Entrar se NÃO for membro ainda */}
              {!isMember && (
                <button
                  onClick={handleJoin}
                  className={styles.communityLinkAction}
                  style={{
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    width: "100%",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <span className={styles.iconWrapper}>
                    <RiUserCommunityLine size={22} />
                  </span>
                  <span>Entrar na Comunidade</span>
                </button>
              )}

              {/* CORRIGIDO: Só mostra o botão de Sair se ele JÁ FOR membro */}
              {isMember && (
                <button
                  onClick={handleLeave}
                  className={styles.communityLinkAction}
                  style={{
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    width: "100%",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <span className={styles.iconWrapper}>
                    <RiCloseCircleLine size={23} />
                  </span>
                  <span>Sair da Comunidade</span>
                </button>
              )}

              <Link className={styles.communityLinkAction} href={`/`}>
                <span className={styles.iconWrapper}>
                  <GoCircleSlash size={20} />
                </span>
                <span>Denunciar Comunidade</span>
              </Link>
            </>
          )}

          {/* Se FOR o proprietário, mostra ferramentas de gestão */}
          {owner && (
            <>
              <Link className={styles.communityLinkAction} href={`/`}>
                <span className={styles.iconWrapper}>
                  <RiMegaphoneLine size={20} />
                </span>
                <span>Promover</span>
              </Link>

              <Link className={styles.communityLinkAction} href={`/`}>
                <span className={styles.iconWrapper}>
                  <BsGear size={20} />
                </span>
                <span>Configurações</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export { CommunityBasicInfoComponent };

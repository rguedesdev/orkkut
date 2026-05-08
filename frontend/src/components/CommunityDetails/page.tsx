// Imports Principais
import Image from "next/image";
import Link from "next/link";

// Style Sheet CSS
import styles from "./communitydetails.module.css";

// Components
import { IoLanguage } from "react-icons/io5";
import { IoCalendarOutline } from "react-icons/io5";
import { RiGitRepositoryPrivateLine } from "react-icons/ri";
import { TbCategory2 } from "react-icons/tb";
import { LiaGlobeAmericasSolid } from "react-icons/lia";
import { FaShieldHalved } from "react-icons/fa6";
import { RiVipCrownLine } from "react-icons/ri";
import { FaRegEye } from "react-icons/fa";
import { data } from "framer-motion/client";

interface ICommunity {
  name: string;
  description: string;
  createdAt: string;
  category: string;
  privacy: string;
  country: string;
  language: string;
}

function CommunityDetailsComponent({ community }: { community: ICommunity }) {
  // Função auxiliar para formatar a data
  const formatDate = (dateValue) => {
    if (!dateValue) return "Data não disponível";

    // Converte para número caso venha como string de timestamp
    const date = new Date(Number(dateValue));

    // Retorna no formato dd/mm/yyyy
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <section>
      <div className={styles.communityDetailsContainer}>
        <h1 className={styles.communityName}>{community.name}</h1>

        <p className={styles.communityDescription}>{community.description}</p>

        <hr className={styles.communityDetailsHrFaded} />

        <div className={styles.communityInfoContainer}>
          <div className={styles.communityInfoColumn}>
            <div className={styles.communityInfoLine}>
              <dt className={styles.communityInfoLineLabel}>
                <IoCalendarOutline size={20} /> <span>Criada em</span>
              </dt>
              <dd className={styles.communityInfoLineValue}>
                <span>{formatDate(community.createdAt)}</span>
              </dd>
            </div>

            <div className={styles.communityInfoLine}>
              <dt className={styles.communityInfoLineLabel}>
                <TbCategory2 size={20} /> <span>Categoria</span>
              </dt>
              <dd className={styles.communityInfoLineValue}>
                <span className={styles.capitalize}>{community.category}</span>
              </dd>
            </div>

            <div className={styles.communityInfoLine}>
              <dt className={styles.communityInfoLineLabel}>
                <RiGitRepositoryPrivateLine size={20} />{" "}
                <span>Privacidade</span>
              </dt>
              <dd className={styles.communityInfoLineValue}>
                <span>
                  {community.privacy === "public"
                    ? "Público"
                    : community.privacy === "private"
                      ? "Privado"
                      : "Secreto"}
                </span>
              </dd>
            </div>

            <div className={styles.communityInfoLine}>
              <dt className={styles.communityInfoLineLabel}>
                <FaRegEye size={18} />
                <span>Visibilidade</span>
              </dt>
              <dd className={styles.communityInfoLineValue}>
                <span>Qualquer Pessoa</span>
              </dd>
            </div>
          </div>

          <div className={styles.communityInfoColumn}>
            <div className={styles.communityInfoLine}>
              <dt className={styles.communityInfoLineLabel}>
                <LiaGlobeAmericasSolid size={20} /> <span>País</span>
              </dt>
              <dd className={styles.communityInfoLineValue}>
                <span>
                  {community.country === "brazil" ? "Brasil" : "Estados Unidos"}
                </span>
              </dd>
            </div>

            <div className={styles.communityInfoLine}>
              <dt className={styles.communityInfoLineLabel}>
                <IoLanguage size={20} /> <span>Idioma</span>
              </dt>
              <dd className={styles.communityInfoLineValue}>
                <span>
                  {community.language === "pt-BR"
                    ? "Português Brasileiro"
                    : "Inglês"}
                </span>
              </dd>
            </div>

            <div className={styles.communityInfoLine}>
              <dt className={styles.communityInfoLineLabel}>
                <RiVipCrownLine size={20} /> <span>Proprietário</span>
              </dt>
              <dd className={styles.communityInfoLineValue}>
                <span>Reinaldo Guedes</span>
              </dd>
            </div>

            <div className={styles.communityInfoLine}>
              <dt className={styles.communityInfoLineLabel}>
                <FaShieldHalved size={18} /> <span>Moderadores</span>
              </dt>
              <dd className={styles.communityInfoLineValue}>
                <span>Muh, Rika Get Set</span>
              </dd>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export { CommunityDetailsComponent };

// Imports Principais
import Image from "next/image";
import Link from "next/link";

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

function CommunityBasicInfoComponent({ community, owner }) {
  console.log("Dados da comunidade", community);
  console.log("Id do USuario", owner);

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
          {/* <h1 className={styles.communityBasicInfoName}>{community.name}</h1> */}
          <p className={styles.communityMembers}>
            <MdOutlinePeopleAlt size={22} />
            <span>
              {community.members <= 1
                ? `${community.members} membro`
                : `${community.members} membros`}
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

          {/* Se NÃO for o proprietário, mostra as opções de entrar/sair/denunciar */}
          {!owner && (
            <>
              <Link className={styles.communityLinkAction} href={`/`}>
                <span className={styles.iconWrapper}>
                  <RiUserCommunityLine size={22} />
                </span>
                <span>Entrar na Comunidade</span>
              </Link>

              <Link className={styles.communityLinkAction} href={`/`}>
                <span className={styles.iconWrapper}>
                  <RiCloseCircleLine size={23} />
                </span>
                <span>Sair da Comunidade</span>
              </Link>

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
              {/* <Link className={styles.communityLinkAction} href={`/`}>
                <span className={styles.iconWrapper}>
                  <RiUserCommunityLine size={22} />
                </span>
                <span>Entrar na Comunidade</span>
              </Link>

              <Link className={styles.communityLinkAction} href={`/`}>
                <span className={styles.iconWrapper}>
                  <RiCloseCircleLine size={23} />
                </span>
                <span>Sair da Comunidade</span>
              </Link> */}

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

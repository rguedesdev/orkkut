// Imports Principais
import Image from "next/image";
import Link from "next/link";

// Style Sheet CSS
import styles from "./forum.module.css";

// Icons
import { FiMoreHorizontal } from "react-icons/fi";

import { MdOutlineTopic } from "react-icons/md";
import { MdShortText } from "react-icons/md";

import { BsChatLeftDots } from "react-icons/bs";
import { IoChatboxEllipsesOutline } from "react-icons/io5";

import { PiChatText } from "react-icons/pi";
import { MdOutlineReplyAll } from "react-icons/md";

import { FaRegPenToSquare } from "react-icons/fa6";

// Images
import Kon from "../../../public/kon.jpg";

function ForumComponent() {
  return (
    <section>
      <div className={styles.forumContainer}>
        <div className={styles.topForumElements}>
          <h2 className={styles.forumTitle}>Fórum</h2>

          <Link className={styles.createTopicBtn} href={`/create-topic`}>
            <FaRegPenToSquare size={20} /> <span>Criar Tópico</span>
          </Link>
        </div>

        <div className={styles.topicContainer}>
          <Image
            className={styles.forumPicture}
            src={Kon}
            alt="Forum Picture"
            width={0}
            height={0}
            priority
          />
          <div className={styles.topicTexts}>
            <h3 className={styles.topicTitle}>
              <MdShortText size={30} />
              <span>Episódio 1 - 2ª Temporada (Contém Spoilers)</span>
            </h3>

            <p className={styles.topicInfo}>
              <IoChatboxEllipsesOutline size={22} />
              <span>55 Respostas</span>
            </p>
          </div>
        </div>

        <hr className={styles.forumHrFaded} />

        <div className={styles.topicContainer}>
          <Image
            className={styles.forumPicture}
            src={Kon}
            alt="Forum Picture"
            width={0}
            height={0}
            priority
          />
          <div className={styles.topicTexts}>
            <h3 className={styles.topicTitle}>
              <MdShortText size={30} />
              <span>Capítulo 155: Túmulo dos Vagalumes</span>
            </h3>

            <p className={styles.topicInfo}>
              <IoChatboxEllipsesOutline size={22} />
              <span>95 Respostas</span>
            </p>
          </div>
        </div>

        <hr className={styles.forumHrFaded} />

        <div className={styles.topicContainer}>
          <Image
            className={styles.forumPicture}
            src={Kon}
            alt="Forum Picture"
            width={0}
            height={0}
            priority
          />
          <div className={styles.topicTexts}>
            <h3 className={styles.topicTitle}>
              <MdShortText size={30} />
              <span>Capítulo 155: Túmulo dos Vagalumes</span>
            </h3>

            <p className={styles.topicInfo}>
              <IoChatboxEllipsesOutline size={22} />
              <span>20 Respostas</span>
            </p>
          </div>
        </div>

        <hr className={styles.forumHrFaded} />

        <div className={styles.topicContainer}>
          <Image
            className={styles.forumPicture}
            src={Kon}
            alt="Forum Picture"
            width={0}
            height={0}
            priority
          />
          <div className={styles.topicTexts}>
            <h3 className={styles.topicTitle}>
              <MdShortText size={30} />
              <span>Capítulo 155: Túmulo dos Vagalumes</span>
            </h3>

            <p className={styles.topicInfo}>
              <IoChatboxEllipsesOutline size={22} />
              <span>20 Respostas</span>
            </p>
          </div>
        </div>

        <hr className={styles.forumHrFaded} />

        <div className={styles.topicContainer}>
          <Image
            className={styles.forumPicture}
            src={Kon}
            alt="Forum Picture"
            width={0}
            height={0}
            priority
          />
          <div className={styles.topicTexts}>
            <h3 className={styles.topicTitle}>
              <MdShortText size={30} />
              <span>Capítulo 155: Túmulo dos Vagalumes</span>
            </h3>

            <p className={styles.topicInfo}>
              <IoChatboxEllipsesOutline size={22} />
              <span>20 Respostas</span>
            </p>
          </div>
        </div>

        <hr className={styles.forumHrFaded} />

        <div className={styles.topicContainer}>
          <Image
            className={styles.forumPicture}
            src={Kon}
            alt="Forum Picture"
            width={0}
            height={0}
            priority
          />
          <div className={styles.topicTexts}>
            <h3 className={styles.topicTitle}>
              <MdShortText size={30} />
              <span>Capítulo 155: Túmulo dos Vagalumes</span>
            </h3>

            <p className={styles.topicInfo}>
              <IoChatboxEllipsesOutline size={22} />
              <span>20 Respostas</span>
            </p>
          </div>
        </div>

        <hr className={styles.forumHrFaded} />

        <div className={styles.topicContainer}>
          <Image
            className={styles.forumPicture}
            src={Kon}
            alt="Forum Picture"
            width={0}
            height={0}
            priority
          />
          <div className={styles.topicTexts}>
            <h3 className={styles.topicTitle}>
              <MdShortText size={30} />
              <span>Capítulo 155: Túmulo dos Vagalumes</span>
            </h3>

            <p className={styles.topicInfo}>
              <IoChatboxEllipsesOutline size={22} />
              <span>20 Respostas</span>
            </p>
          </div>
        </div>

        <hr className={styles.forumHrFaded} />

        <Link
          className={styles.seeAllForuns}
          href={`/`}
          aria-label="Ver todos os depoimentos"
        >
          <span>Ver todos</span> <FiMoreHorizontal size={20} />
        </Link>
      </div>
    </section>
  );
}

export { ForumComponent };

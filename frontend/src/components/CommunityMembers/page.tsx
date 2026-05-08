// Imports Principais
import Image from "next/image";
import Link from "next/link";

// Style Sheet CSS
import styles from "./communitymembers.module.css";

// Icons
import { FiMoreHorizontal } from "react-icons/fi";

// Images
import Kon from "../../../public/kon.jpg";

function CommunityMembersComponent() {
  const members = [
    { id: "6948ebd12954226d52b52b20", name: "Kon Sama", img: Kon },
    { id: "6948ebd12954226d52b52b20", name: "Rika Get Set", img: Kon },
    { id: "6948ebd12954226d52b52b20", name: "Muh", img: Kon },
    { id: "6948ebd12954226d52b52b20", name: "Saga", img: Kon },
    { id: "6948ebd12954226d52b52b20", name: "Julee", img: Kon },
    { id: "6948ebd12954226d52b52b20", name: "Gabi Orihime", img: Kon },
    { id: "6948ebd12954226d52b52b20", name: "Miaka", img: Kon },
    { id: "6948ebd12954226d52b52b20", name: "Ree", img: Kon },
    { id: "6948ebd12954226d52b52b20", name: "Nika", img: Kon },
  ];

  return (
    <section aria-labelledby={styles.communityMembersTitle}>
      <div className={styles.communityMembersContainer}>
        <h2 id="friends-title" className={styles.communityMembersTitle}>
          Membros {/* ({members.length}) */}
        </h2>

        <ul className={styles.members}>
          {members.map((member) => (
            <li key={member.id} className={styles.memberContainer}>
              <Link
                className={styles.linkMemberProfile}
                href={`/user/${member.id}`}
              >
                <figure className={styles.memberInfo}>
                  <Image
                    className={styles.memberPicture}
                    src={member.img}
                    alt={`Foto de perfil de ${member.name}`}
                    width={80}
                    height={80}
                    priority
                  />
                  <figcaption className={styles.memberNameNickname}>
                    {member.name}
                  </figcaption>
                </figure>
              </Link>
            </li>
          ))}
        </ul>

        <hr className={styles.memberHrFaded} />

        <Link
          className={styles.seeAllMembers}
          href="/"
          aria-label="Ver todos os amigos"
        >
          <span>Ver todos</span> <FiMoreHorizontal size={20} />
        </Link>
      </div>
    </section>
  );
}

export { CommunityMembersComponent };

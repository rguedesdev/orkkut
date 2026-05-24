// Imports Principais
import Image from "next/image";
import Link from "next/link";

// Style Sheet CSS
import styles from "./communitymembers.module.css";

// Icons
import { FiMoreHorizontal } from "react-icons/fi";

// Images
import Kon from "../../../public/kon.jpg";

function CommunityMembersComponent({ communityMembers }) {
  // Se o backend ainda estiver carregando ou vier vazio, garante que não quebre
  const membersList = communityMembers || [];

  // O Orkut original mostrava no máximo 9 membros naquele quadradinho da lateral.
  // Vamos pegar apenas os 9 primeiros da lista para não quebrar o seu layout!
  const previewMembers = membersList.slice(0, 9);

  return (
    <section aria-labelledby="friends-title">
      <div className={styles.communityMembersContainer}>
        <h2 id="friends-title" className={styles.communityMembersTitle}>
          Membros ({membersList.length})
        </h2>

        <ul className={styles.members}>
          {previewMembers.map((item) => {
            // Desestruturando o 'user' e o 'role' de dentro do padrão do seu GraphQL
            const { user, role } = item;

            return (
              <li key={user.id} className={styles.memberContainer}>
                <Link
                  className={styles.linkMemberProfile}
                  href={`/user/${user.id}`}
                >
                  <figure className={styles.memberInfo}>
                    <Image
                      className={styles.memberPicture}
                      // Se futuramente você tiver user.avatar, usa ele, senão vai o default
                      src={user.avatar || Kon}
                      alt={`Foto de perfil de ${user.name}`}
                      width={80}
                      height={80}
                      priority
                    />
                    <figcaption className={styles.memberNameNickname}>
                      {user.name}
                    </figcaption>
                  </figure>
                </Link>
              </li>
            );
          })}
        </ul>

        <hr className={styles.memberHrFaded} />

        <Link
          className={styles.seeAllMembers}
          href="/" // Futuramente você pode mudar para `/community/${communityId}/members`
          aria-label="Ver todos os membros"
        >
          <span>Ver todos</span> <FiMoreHorizontal size={20} />
        </Link>
      </div>
    </section>
  );
}

export { CommunityMembersComponent };

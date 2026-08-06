"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FiMoreHorizontal } from "react-icons/fi";

import Kon from "../../../public/kon.jpg";
import api from "@/utils/api";
import styles from "./friends.module.css";

type FriendUser = {
  id: string;
  name: string;
  username: string;
  profile?: { avatarImage?: { url: string } | null } | null;
};
function FriendsComponent({ userID, isOwnProfile = false }: { userID: string; isOwnProfile?: boolean }) {
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [blocked, setBlocked] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionID, setActionID] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const ownFields = isOwnProfile ? `
      myBlockedUsers { id name username profile { avatarImage { url } } }
    ` : "";
    const response = await api.post("/graphql", {
      query: `query Friends($userID: ID!) {
        friendsOf(userID: $userID) { id name username profile { avatarImage { url } } }
        ${ownFields}
      }`,
      variables: { userID },
    });
    if (response.data.errors?.length) throw new Error(response.data.errors[0].message);
    setFriends(response.data.data.friendsOf);
    if (isOwnProfile) {
      setBlocked(response.data.data.myBlockedUsers);
    }
  }, [isOwnProfile, userID]);

  useEffect(() => {
    setLoading(true);
    void load()
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar amigos."))
      .finally(() => setLoading(false));
  }, [load]);

  const mutate = async (query: string, variables: Record<string, string>, id: string) => {
    if (actionID) return;
    setActionID(id);
    setError(null);
    try {
      const response = await api.post("/graphql", { query, variables });
      if (response.data.errors?.length) throw new Error(response.data.errors[0].message);
      await load();
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Não foi possível atualizar a amizade.");
    } finally {
      setActionID(null);
    }
  };

  const userCard = (user: FriendUser) => (
    <li key={user.id} className={styles.friendContainer}>
      <Link className={styles.friendLink} href={`/user/${encodeURIComponent(user.username)}`}>
        <figure className={styles.friendInfo}>
          <Image
            className={styles.friendPicture}
            src={user.profile?.avatarImage?.url ?? Kon}
            alt={`Foto de perfil de ${user.name}`}
            width={80}
            height={80}
            unoptimized={Boolean(user.profile?.avatarImage?.url)}
          />
          <figcaption className={styles.friendNameUsername}>{user.name}</figcaption>
        </figure>
      </Link>
    </li>
  );

  return (
    <section aria-labelledby="friends-title">
      <div className={styles.friendsContainer}>
        <h2 id="friends-title" className={styles.friendTitle}>Amigos ({friends.length})</h2>
        {loading ? <p role="status">Carregando amigos…</p> : (
          friends.length ? <ul className={styles.friends}>{friends.map(userCard)}</ul> : <p>Nenhum amigo ainda.</p>
        )}

        {isOwnProfile && blocked.length > 0 && (
          <>
            <h3>Usuários bloqueados ({blocked.length})</h3>
            {blocked.map((user) => (
              <div key={user.id}>
                <span>{user.name}</span>
                <div className={styles.requestActions}>
                  <button type="button" disabled={Boolean(actionID)} onClick={() => mutate(
                    `mutation($userID: ID!) { unblockUser(userID: $userID) { status } }`,
                    { userID: user.id }, user.id,
                  )}>Desbloquear</button>
                </div>
              </div>
            ))}
          </>
        )}

        {error && <p role="alert">{error}</p>}
        <hr className={styles.friendHrFaded} />
        <Link className={styles.seeAllFriends} href="#friends-title" aria-label="Ver todos os amigos">
          <span>Ver todos</span> <FiMoreHorizontal size={20} />
        </Link>
      </div>
    </section>
  );
}

export { FriendsComponent };

"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import Kon from "../../../public/kon.jpg";
import api from "@/utils/api";
import styles from "./friendrequests.module.css";

type RequestUser = {
  id: string;
  name: string;
  username: string;
  profile?: { avatarImage?: { url: string } | null } | null;
};

type FriendRequest = {
  id: string;
  friend: RequestUser;
};

function FriendRequestsComponent({ onRelationshipChanged }: { onRelationshipChanged?: () => void }) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionID, setActionID] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await api.post("/graphql", {
      query: `query ReceivedFriendRequests {
        receivedFriendRequests {
          id
          friend { id name username profile { avatarImage { url } } }
        }
        sentFriendRequests {
          id
          friend { id name username profile { avatarImage { url } } }
        }
      }`,
    });
    if (response.data.errors?.length) throw new Error(response.data.errors[0].message);
    setRequests(response.data.data.receivedFriendRequests);
    setSentRequests(response.data.data.sentFriendRequests);
  }, []);

  useEffect(() => {
    void load()
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as solicitações."))
      .finally(() => setLoading(false));
  }, [load]);

  const respond = async (request: FriendRequest, accept: boolean) => {
    if (actionID || (!accept && !window.confirm(`Recusar a solicitação de @${request.friend.username}?`))) return;
    setActionID(request.id);
    setError(null);
    try {
      const response = await api.post("/graphql", {
        query: accept
          ? `mutation($requestID: ID!) { acceptFriendRequest(requestID: $requestID) { id } }`
          : `mutation($requestID: ID!) { declineFriendRequest(requestID: $requestID) { id } }`,
        variables: { requestID: request.id },
      });
      if (response.data.errors?.length) throw new Error(response.data.errors[0].message);
      setRequests((current) => current.filter((item) => item.id !== request.id));
      onRelationshipChanged?.();
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Não foi possível responder à solicitação.");
    } finally {
      setActionID(null);
    }
  };

  const cancel = async (request: FriendRequest) => {
    if (actionID || !window.confirm(`Cancelar a solicitação enviada para @${request.friend.username}?`)) return;
    setActionID(request.id);
    setError(null);
    try {
      const response = await api.post("/graphql", {
        query: `mutation($requestID: ID!) { cancelFriendRequest(requestID: $requestID) { id } }`,
        variables: { requestID: request.id },
      });
      if (response.data.errors?.length) throw new Error(response.data.errors[0].message);
      setSentRequests((current) => current.filter((item) => item.id !== request.id));
      onRelationshipChanged?.();
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Não foi possível cancelar a solicitação.");
    } finally {
      setActionID(null);
    }
  };

  if (loading || (!requests.length && !sentRequests.length && !error)) return null;

  return (
    <section aria-labelledby="friend-requests-title">
      <div className={styles.requestsContainer}>
        <h2 id="friend-requests-title" className={styles.requestsTitle}>
          Solicitações de amizade ({requests.length + sentRequests.length})
        </h2>

        {requests.length > 0 && <h3 className={styles.requestSectionTitle}>Recebidas</h3>}
        <div className={styles.requests}>
          {requests.map((request, index) => (
            <div key={request.id}>
              <article className={styles.request}>
                <Link href={`/user/${encodeURIComponent(request.friend.username)}`}>
                  <Image
                    className={styles.requestImage}
                    alt={`Foto de perfil de ${request.friend.name}`}
                    src={request.friend.profile?.avatarImage?.url ?? Kon}
                    width={80}
                    height={80}
                    unoptimized={Boolean(request.friend.profile?.avatarImage?.url)}
                  />
                </Link>

                <div className={styles.requestContent}>
                  <div>
                    <h3 className={styles.requestName}>{request.friend.name}</h3>
                    <Link className={styles.requestUsername} href={`/user/${encodeURIComponent(request.friend.username)}`}>
                      @{request.friend.username}
                    </Link>
                  </div>
                  <div className={styles.requestActions}>
                    <button type="button" disabled={Boolean(actionID)} onClick={() => respond(request, true)}>
                      Aceitar
                    </button>
                    <button type="button" disabled={Boolean(actionID)} onClick={() => respond(request, false)}>
                      Recusar
                    </button>
                  </div>
                </div>
              </article>
              {index < requests.length - 1 && <hr className={styles.requestDivider} />}
            </div>
          ))}
        </div>

        {sentRequests.length > 0 && (
          <>
            <h3 className={styles.requestSectionTitle}>Enviadas</h3>
            <div className={styles.requests}>
              {sentRequests.map((request, index) => (
                <div key={request.id}>
                  <article className={styles.request}>
                    <Link href={`/user/${encodeURIComponent(request.friend.username)}`}>
                      <Image
                        className={styles.requestImage}
                        alt={`Foto de perfil de ${request.friend.name}`}
                        src={request.friend.profile?.avatarImage?.url ?? Kon}
                        width={80}
                        height={80}
                        unoptimized={Boolean(request.friend.profile?.avatarImage?.url)}
                      />
                    </Link>
                    <div className={styles.requestContent}>
                      <div>
                        <h3 className={styles.requestName}>{request.friend.name}</h3>
                        <Link className={styles.requestUsername} href={`/user/${encodeURIComponent(request.friend.username)}`}>
                          @{request.friend.username}
                        </Link>
                      </div>
                      <div className={styles.requestActions}>
                        <button type="button" disabled={Boolean(actionID)} onClick={() => cancel(request)}>
                          Cancelar solicitação
                        </button>
                      </div>
                    </div>
                  </article>
                  {index < sentRequests.length - 1 && <hr className={styles.requestDivider} />}
                </div>
              ))}
            </div>
          </>
        )}

        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>
    </section>
  );
}

export { FriendRequestsComponent };

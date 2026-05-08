"use client";

// Imports Principais
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Api Axios
import api from "@/utils/api";

// Style Sheet CSS
import styles from "./searchmain.module.css";

// Componentes

// Icons
import { IoSearch } from "react-icons/io5";

// Images
import Comu from "../../../public/eu_odeio2.png";

function SearchMain() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResult] = useState({
    users: [] as any[],
    communities: [] as any[],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handdleSearch = async () => {
    if (!search.trim()) return;

    setHasSearched(true);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await api.post(
        "/graphql",
        {
          query: `
          query GlobalSearch($search: String!) {
            globalSearch(search: $search) {
              users {
                id
                name
                nickname
              }
              communities {
                id
                name
                category
                members
              }         
            }  
          }
          `,
          variables: {
            search: search,
          },
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      if (response.data.errors) {
        console.error(response.data.errors);
        return;
      }

      setResult(response.data.data.globalSearch);
    } catch (err) {
      console.error("Erro na busca:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className={styles.searchMainContainer}>
      <h1 className={styles.searchTitle}>O que você está procurando?</h1>
      <h2 className={styles.searchSubtitle}>
        Busque comunidades e pessoas no Orkkut:
      </h2>
      <div className={styles.searchInput}>
        <IoSearch className={styles.searchIcon} size={20} />
        <input
          type="search"
          placeholder="Buscar no Orkkut..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handdleSearch();
            }
          }}
        />
      </div>

      {isLoading && <p className="text-white">Buscando...</p>}

      {results.communities.length > 0 && (
        <>
          <h2 className={styles.resultTitle}>Comunidades encontradas:</h2>

          <div className={styles.usersCommunitiesResultContainer}>
            {results.communities.map((community) => (
              <div
                key={community.id}
                className={styles.searchResult}
                onClick={() => router.push(`/community/${community.id}`)}
              >
                <Image
                  className={styles.searchImage}
                  src={Comu}
                  alt="Community Picture"
                  width={100}
                  height={100}
                />
                <div className={styles.searchResultTexts}>
                  <h3 className={styles.searchResultTitle}>{community.name}</h3>
                  <div className={styles.searchResultInfo}>
                    <h4>{`• ${community.members} membros`}</h4>
                    <h5>{`• ${community.category}`}</h5>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {results.users.length > 0 && (
        <>
          <h2 className={styles.resultTitle}>Usuários encontrados:</h2>

          <div className={styles.usersCommunitiesResultContainer}>
            {results.users.map((user) => (
              <div
                key={`${user.id}`}
                className={styles.searchResult}
                onClick={() => router.push(`/user/${user.id}`)}
              >
                <Image
                  className={styles.searchImage}
                  src={Comu}
                  alt="User Picture"
                  width={100}
                  height={100}
                />
                <div className={styles.searchResultTexts}>
                  <h3 className={styles.searchResultTitle}>{user.name}</h3>
                  <div className={styles.searchResultInfo}>
                    <h4>{`@${user.nickname}`}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!isLoading &&
        hasSearched &&
        results.users.length === 0 &&
        results.communities.length === 0 && (
          <p className={styles.noResultsFound}>Nenhum resultado encontrado.</p>
        )}
    </section>
  );
}

export { SearchMain };

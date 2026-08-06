// Style Sheet CSS
import styles from "./search.module.css";

// Components
import { SearchAside } from "@/components/SearchAside/page";
import { SearchMain } from "@/components/SearchMain/page";

// Icons
import { IoSearch } from "react-icons/io5";

function SearchPage() {
  return (
    <div className={styles.page}>
      <main className={styles.searchContainer}>
        <SearchAside />
        <SearchMain />
      </main>
    </div>
  );
}

export default SearchPage;

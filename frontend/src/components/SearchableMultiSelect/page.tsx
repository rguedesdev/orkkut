"use client";

import { useMemo, useState } from "react";
import styles from "./searchablemultiselect.module.css";

type Option = { id: string; name: string; icon?: string | null };
type Props = {
  label: string;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  disabled?: boolean;
};

function SearchableMultiSelect({ label, options, value, onChange, error, disabled }: Props) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () => options.filter((option) => option.name.toLowerCase().includes(search.toLowerCase())),
    [options, search],
  );

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);
  };

  return (
    <fieldset className={styles.field} disabled={disabled}>
      <legend>{label}</legend>
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={`Buscar em ${label.toLowerCase()}`}
      />
      <div className={styles.options}>
        {filtered.map((option) => (
          <label key={option.id} className={value.includes(option.id) ? styles.selected : ""}>
            <input
              type="checkbox"
              checked={value.includes(option.id)}
              onChange={() => toggle(option.id)}
            />
            {option.icon && <span>{option.icon}</span>}
            {option.name}
          </label>
        ))}
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </fieldset>
  );
}

export { SearchableMultiSelect };
export type { Option as SearchableOption };

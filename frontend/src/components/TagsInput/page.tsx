"use client";

import { KeyboardEvent, useState } from "react";
import styles from "./tagsinput.module.css";

type Props = {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  maxItems?: number;
  disabled?: boolean;
};

function TagsInput({ label, value, onChange, error, maxItems = 20, disabled }: Props) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const tag = draft.trim().replace(/\s+/g, " ");
    if (!tag || tag.length > 40 || value.length >= maxItems) return;
    if (!value.some((item) => item.toLowerCase() === tag.toLowerCase())) {
      onChange([...value, tag]);
    }
    setDraft("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add();
    }
  };

  return (
    <fieldset className={styles.field} disabled={disabled}>
      <legend>{label}</legend>
      <div className={styles.tags}>
        {value.map((tag) => (
          <span key={tag}>
            {tag}
            <button type="button" onClick={() => onChange(value.filter((item) => item !== tag))} aria-label={`Remover ${tag}`}>×</button>
          </span>
        ))}
      </div>
      <div className={styles.inputRow}>
        <input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={onKeyDown} maxLength={40} placeholder="Digite e pressione Enter" />
        <button type="button" onClick={add}>Adicionar</button>
      </div>
      <small>{value.length}/{maxItems}</small>
      {error && <p className={styles.error}>{error}</p>}
    </fieldset>
  );
}

export { TagsInput };

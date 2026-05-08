import { UseFormRegisterReturn } from "react-hook-form";

// Style Sheet CSS
import styles from "./select.module.css";

// Definimos o formato de cada opção
interface IOption {
  value: string;
  label: string;
}

interface ISelect {
  selectLabel: string;
  register: UseFormRegisterReturn;
  options: IOption[]; // Agora é um array de objetos
  error?: string;
}

function SelectComponent({ selectLabel, register, options, error }: ISelect) {
  return (
    <div className={styles.selectContainer}>
      <label htmlFor="category" className={styles.legend}>
        {selectLabel}
      </label>

      <select
        id="category"
        className={`${error ? `${styles.customSelectError}` : `${styles.customSelect}`}`}
        {...register}
      >
        <option value="">Selecione uma categoria...</option>
        {options.map((option) => (
          // Usamos option.value para o sistema e option.label para o humano
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && <span className={styles.errorSelect}>{`※ ${error}`}</span>}
    </div>
  );
}

export { SelectComponent };

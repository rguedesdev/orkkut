// Imports Principais
import { UseFormRegisterReturn } from "react-hook-form";

// Style Sheet CSS
import styles from "./input.module.css";

interface IInput {
  inputLabel: string;
  inputType: string;
  inputID: string;
  inputPlaceholder: string;
  register: UseFormRegisterReturn;
  error?: string;
}

function InputComponent({
  inputLabel,
  inputType,
  inputID,
  inputPlaceholder,
  register,
  error,
}: IInput) {
  return (
    <div className={styles.inputContainer}>
      <fieldset className={error ? styles.fieldsetError : styles.fieldset}>
        <legend className={styles.legend}>{inputLabel}</legend>

        <input
          className={styles.input}
          type={inputType}
          id={inputID}
          placeholder={inputPlaceholder}
          {...register}
        />
      </fieldset>

      {error && <span className={styles.errorMessage}>{`※ ${error}`}</span>}
    </div>
  );
}

export { InputComponent };

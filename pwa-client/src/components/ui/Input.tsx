import React from "react";
import styles from "./Input.module.css";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export function Input({ label, error, helper, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  const inputClass = [styles.input, error ? styles.error : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.wrapper}>
      {label && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className={styles.inputContainer}>
        <input id={inputId} className={inputClass} {...props} />
      </div>
      {error && <p className={styles.errorText}>{error}</p>}
      {helper && !error && <p className={styles.helperText}>{helper}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

export function Select({ label, error, children, className, id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  const selectClass = [
    styles.input,
    styles.select,
    error ? styles.error : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.wrapper}>
      {label && (
        <label className={styles.label} htmlFor={selectId}>
          {label}
        </label>
      )}
      <select id={selectId} className={selectClass} {...props}>
        {children}
      </select>
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
}

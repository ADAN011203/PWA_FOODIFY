import React from "react";
import styles from "./Card.module.css";

type CardTone = "default" | "danger" | "warning" | "success" | "accent";
type CardPadding = "none" | "md" | "lg";

interface CardProps {
  children: React.ReactNode;
  hoverable?: boolean;
  tone?: CardTone;
  padding?: CardPadding;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function Card({
  children,
  hoverable = false,
  tone = "default",
  padding = "md",
  className,
  onClick,
  style,
}: CardProps) {
  const classes = [
    styles.card,
    hoverable ? styles.hoverable : "",
    tone !== "default" ? styles[tone] : "",
    padding === "md" ? styles.padded : padding === "lg" ? styles["padded-lg"] : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} onClick={onClick} style={style}>
      {children}
    </div>
  );
}

// Avaliação de força de senha + checklist visual

export interface PasswordChecks {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
}

export type StrengthLevel = "empty" | "weak" | "medium" | "strong";

export interface StrengthResult {
  level: StrengthLevel;
  score: number; // 0-5
  checks: PasswordChecks;
  label: string;
  colorClass: string; // bg
  textClass: string;
}

export function evaluatePassword(pwd: string): StrengthResult {
  const checks: PasswordChecks = {
    length: pwd.length >= 8,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?&$#@+]/.test(pwd),
  };
  const score = Object.values(checks).filter(Boolean).length;

  if (!pwd) {
    return {
      level: "empty",
      score: 0,
      checks,
      label: "",
      colorClass: "bg-border",
      textClass: "text-muted-foreground",
    };
  }
  if (score <= 2) {
    return {
      level: "weak",
      score,
      checks,
      label: "Fraca",
      colorClass: "bg-destructive",
      textClass: "text-destructive",
    };
  }
  if (score <= 4) {
    return {
      level: "medium",
      score,
      checks,
      label: "Média",
      colorClass: "bg-orange-500",
      textClass: "text-orange-500",
    };
  }
  return {
    level: "strong",
    score,
    checks,
    label: "Forte",
    colorClass: "bg-green-500",
    textClass: "text-green-500",
  };
}

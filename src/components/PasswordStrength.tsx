import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { evaluatePassword } from "@/lib/passwordStrength";

interface Props {
  password: string;
  className?: string;
}

export const PasswordStrength = ({ password, className }: Props) => {
  const r = evaluatePassword(password);
  const segments = 5;

  const items: { key: keyof typeof r.checks; label: string }[] = [
    { key: "length", label: "8 ou mais caracteres" },
    { key: "upper", label: "Letra maiúscula" },
    { key: "lower", label: "Letra minúscula" },
    { key: "number", label: "Número" },
    { key: "special", label: "Caractere especial (&$#@+)" },
  ];

  return (
    <div className={cn("mt-2 space-y-2", className)}>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: segments }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i < r.score ? r.colorClass : "bg-border"
            )}
          />
        ))}
        {r.label && (
          <span className={cn("text-[11px] font-semibold ml-1", r.textClass)}>{r.label}</span>
        )}
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
        {items.map((it) => {
          const ok = r.checks[it.key];
          return (
            <li
              key={it.key}
              className={cn(
                "flex items-center gap-1.5 text-[11px]",
                ok ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {ok ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <X className="h-3 w-3 text-muted-foreground" />
              )}
              {it.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

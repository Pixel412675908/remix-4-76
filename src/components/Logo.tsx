// Logo da StreamFlix — apenas texto estilizado, responsivo e nunca cortado
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "text-base md:text-lg",
  md: "text-lg md:text-xl",
  lg: "text-2xl md:text-3xl",
};

export const Logo = ({ className, size = "md" }: LogoProps) => (
  <Link
    to="/"
    aria-label="StreamFlix — início"
    className={cn("inline-flex items-center select-none whitespace-nowrap", className)}
  >
    <span
      className={cn(
        "font-display font-normal tracking-[0.12em] md:tracking-[0.18em] text-primary leading-none",
        sizes[size]
      )}
    >
      STREAM<span className="text-foreground">FLIX</span>
    </span>
  </Link>
);

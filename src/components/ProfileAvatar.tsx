// Avatar do perfil ativo — imagem ou inicial em gradiente

import { cn } from "@/lib/utils";
import type { Profile } from "@/types/media";

interface ProfileAvatarProps {
  profile?: Profile | null;
  fallbackName?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 md:h-28 md:w-28 text-2xl",
};

export const ProfileAvatar = ({ profile, fallbackName, size = "md", className }: ProfileAvatarProps) => {
  const initial = (profile?.name ?? fallbackName ?? "?").trim().charAt(0).toUpperCase();
  const url = profile?.avatar_url;

  if (url) {
    return (
      <img
        src={url}
        alt={profile?.name ?? "Avatar"}
        loading="lazy"
        width={120}
        height={120}
        className={cn(sizes[size], "rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        sizes[size],
        "rounded-full grid place-items-center font-semibold text-foreground",
        "bg-gradient-to-br from-primary/80 to-primary-glow/60",
        className
      )}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
};

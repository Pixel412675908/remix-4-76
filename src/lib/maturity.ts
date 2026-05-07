// Filtros de maturidade por perfil
// Classificação BR: L, 10, 12, 14, 16, 18

import type { MaturityLevel, MediaBase } from "@/types/media";

const RATING_NUM: Record<string, number> = {
  L: 0,
  "10": 10,
  "12": 12,
  "14": 14,
  "16": 16,
  "18": 18,
};

interface ProfileLike {
  maturity_level: MaturityLevel;
  teen_allow_16: boolean;
}

interface AccountLike {
  allow_adult: boolean;
  allow_explicit?: boolean;
}

/**
 * Retorna true se a mídia pode ser exibida pro perfil ativo.
 * - Conteúdo adult (explícito): exige allow_explicit
 * - Conteúdo mature (+18 geral): exige allow_adult
 */
export function canWatch(
  media: Pick<MediaBase, "ageRating" | "adult" | "mature">,
  profile: ProfileLike | null,
  account: AccountLike | null
): boolean {
  const lvl = profile?.maturity_level ?? "adult";
  const ratingNum = media.ageRating ? RATING_NUM[media.ageRating] ?? 0 : 0;
  const isExplicit = media.adult === true;
  const isMature = media.mature === true || ratingNum >= 16;

  if (lvl === "kids") return ratingNum <= 10 && !isExplicit && !isMature;

  if (lvl === "teen") {
    if (isExplicit) return false;
    const ceiling = profile?.teen_allow_16 ? 16 : 14;
    return ratingNum <= ceiling && !isMature;
  }

  // adult
  if (isExplicit && (!account || !account.allow_explicit)) return false;
  if (isMature && (!account || !account.allow_adult)) return false;
  return true;
}

export const MATURITY_LABELS: Record<MaturityLevel, string> = {
  kids: "Kids",
  teen: "Adolescente",
  adult: "Adulto",
};

export const MATURITY_DESCRIPTIONS: Record<MaturityLevel, string> = {
  kids: "Apenas conteúdos livres ou até 10 anos",
  teen: "Até 14 anos (ou 16 se permitido pelo responsável)",
  adult: "Sem restrições de idade",
};

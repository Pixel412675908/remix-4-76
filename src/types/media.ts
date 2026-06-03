// Core types — preparado para integração futura com APIs externas

export type MediaType = "movie" | "tv";

export interface MediaBase {
  id: number;
  type: MediaType;
  title: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  year: number;
  rating: number;
  ageRating?: string;
  duration?: string;
  genres: string[];
  tags?: string[];
  // Restrição de acesso para Modo Explorador
  freeForExplorer?: boolean;
  // Adulto explícito (sexo explícito): exige allow_explicit
  adult?: boolean;
  // +18 geral (violência, drogas, linguagem): exige allow_adult
  mature?: boolean;
  originalLanguage?: string;
  releaseDate?: string; // YYYY-MM-DD — usado em Em Breve
  audioLanguages?: string[]; // códigos ISO 639-1 disponíveis em áudio
  subtitleLanguages?: string[]; // códigos ISO 639-1 disponíveis em legenda
}

export interface Episode {
  id: number;
  number: number;
  title: string;
  overview: string;
  duration: string;
  stillUrl: string;
}

export interface Season {
  number: number;
  title: string;
  episodes: Episode[];
  episodeCount?: number;
}

export interface Series extends MediaBase {
  type: "tv";
  seasons: Season[];
  totalSeasons: number;
}

export interface Movie extends MediaBase {
  type: "movie";
}

export type Media = Movie | Series;

export interface ContentRow {
  id: string;
  title: string;
  items: Media[];
}

// ===== Tipos de domínio (auth + perfis) =====
export type ContentFilter = "light" | "mature" | "sensitive";
export type ContentType = "movies" | "series" | "documentaries" | "anime" | "doramas" | "reality" | "tv_shows";
export type FormatPref = "short" | "long" | "both";
export type EraPref = "recent" | "classics" | "both";
export type OriginPref = "national" | "international" | "both";
export type DiscoveryPref = "trending" | "personalized" | "mixed";
export type IntensityPref = "light" | "moderate" | "intense";
export type AppLanguage = "pt-BR" | "en-US" | "es-ES";

export type AccountType = "kids" | "teen" | "adult";

export interface Account {
  id: string;
  display_name: string;
  avatar_url: string | null;
  account_type: AccountType;
  allow_adult: boolean;
  allow_explicit: boolean;
  favorite_genres: string[];
  onboarded: boolean;
  onboarding_step: number;
  content_filters: ContentFilter[];
  content_types: ContentType[];
  format: FormatPref;
  era: EraPref;
  language: AppLanguage;
  origin: OriginPref;
  discovery: DiscoveryPref;
  continuity: boolean;
  recommendations: boolean;
  intensity: IntensityPref;
  adult_password_hash?: string | null;
}

export type MaturityLevel = "kids" | "teen" | "adult";

export interface Profile {
  id: string;
  account_id: string;
  name: string;
  avatar_url: string | null;
  is_kid: boolean;
  is_active: boolean;
  card_color: string;
  maturity_level: MaturityLevel;
  teen_allow_16: boolean;
  created_at: string;
}

export const ALL_GENRES = [
  "Ação",
  "Aventura",
  "Comédia",
  "Drama",
  "Terror",
  "Suspense",
  "Ficção Científica",
  "Fantasia",
  "Romance",
  "Mistério",
  "Crime",
  "Animação",
  "Documentário",
  "Guerra",
  "Esporte",
  "Musical",
  "Histórico",
] as const;

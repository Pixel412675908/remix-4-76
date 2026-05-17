// TMDB client — catálogo expandido com filtros, paginação, coleções e novas seções.

import { supabase } from "@/integrations/supabase/client";
import { Media, Movie, Series, ContentRow, Episode, Season } from "@/types/media";

const TMDB_API_KEY = "6878dca421d0d46297b2e433d48fe964";
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_500 = "https://image.tmdb.org/t/p/w500";
const IMG_ORIG = "https://image.tmdb.org/t/p/original";
const LANG = "pt-BR";
const REGION = "BR";
const TODAY = new Date().toISOString().slice(0, 10);

function img(path: string | null | undefined, big = false): string {
  if (!path) return "";
  return `${big ? IMG_ORIG : IMG_500}${path}`;
}

const tmdbMemoryCache = new Map<string, { expiresAt: number; payload: unknown }>();
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

function cacheKeyFor(path: string, params: Record<string, string | number | boolean | undefined>): string {
  const pairs = Object.entries(params)
    .filter(([, v]) => v != null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${String(v)}`)
    .join("|");
  return `tmdb:${path}:${LANG}:${pairs}`;
}

function ttlFor(path: string): number {
  if (path.includes("/trending/")) return WEEK_MS;
  return DAY_MS;
}

async function readCachedTmdb<T>(key: string): Promise<T | null> {
  const mem = tmdbMemoryCache.get(key);
  if (mem && mem.expiresAt > Date.now()) return mem.payload as T;
  try {
    const { data } = await (supabase as any)
      .from("tmdb_cache")
      .select("payload, expires_at")
      .eq("cache_key", key)
      .maybeSingle();
    if (!data || new Date(data.expires_at).getTime() <= Date.now()) return null;
    tmdbMemoryCache.set(key, { payload: data.payload, expiresAt: new Date(data.expires_at).getTime() });
    return data.payload as T;
  } catch {
    return null;
  }
}

async function writeCachedTmdb(key: string, payload: unknown, ttlMs: number): Promise<void> {
  const expiresAt = Date.now() + ttlMs;
  tmdbMemoryCache.set(key, { payload, expiresAt });
  try {
    await (supabase as any).from("tmdb_cache").upsert({
      cache_key: key,
      payload,
      expires_at: new Date(expiresAt).toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Cache é otimização: se o backend não estiver disponível, segue direto pela API.
  }
}

async function tget<T = any>(path: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T> {
  const key = cacheKeyFor(path, params);
  const cached = await readCachedTmdb<T>(key);
  if (cached) return cached;
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", TMDB_API_KEY);
  url.searchParams.set("language", LANG);
  for (const [k, v] of Object.entries(params)) {
    if (v != null) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB ${path} -> ${res.status}`);
  const json = await res.json();
  void writeCachedTmdb(key, json, ttlFor(path));
  return json;
}

interface TmdbItem {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count?: number;
  media_type?: "movie" | "tv";
  genre_ids?: number[];
  adult?: boolean;
  original_language?: string;
}

interface TmdbPage<T> {
  results: T[];
  total_pages?: number;
}

let GENRE_MAP: Record<number, string> | null = null;
async function loadGenres(): Promise<Record<number, string>> {
  if (GENRE_MAP) return GENRE_MAP;
  const [m, t] = await Promise.all([
    tget<{ genres: { id: number; name: string }[] }>("/genre/movie/list"),
    tget<{ genres: { id: number; name: string }[] }>("/genre/tv/list"),
  ]);
  const map: Record<number, string> = {};
  [...m.genres, ...t.genres].forEach((g) => (map[g.id] = g.name));
  GENRE_MAP = map;
  return map;
}

const EXPLICIT_KEYWORDS = /\b(erotic|softcore|hardcore|sex\s*scene|nudit|porn|xxx|hentai|ecchi|sensual|yaoi|yuri|uncensored|adult\s*animation)\b/i;
const EXPLICIT_TITLE_REGEX = /\b(365\s*(d[ií]as|days|dni)|fifty\s*shades|cinquenta\s*tons|365\s*bonus|sex\/?life|emmanuelle|nymphomaniac|9\s*songs|in\s*the\s*realm\s*of\s*the\s*senses|love\s*\(2015\)|blue\s*is\s*the\s*warmest|the\s*idol|elite\s*short|caligula|overflow|mignon|no\s*love\s*zone|4\s*weeks?\s*lovers?|namoro\s*de\s*4\s*semanas|modaete\s*yo\s*adam|adam[- ]?kun|shuudengo|aika|bible\s*black|night\s*shift\s*nurses|discipline|yarichin|futab部|isekai\s*harem|harem\s*in\s*the\s*labyrinth|redo\s*of\s*healer|interspecies\s*reviewers|ishuzoku\s*reviewers|yosuga\s*no\s*sora|kiss\s*x\s*sis)\b/i;
// IDs TMDB de filmes/séries notórios por sexo explícito.
const EXPLICIT_BLACKLIST_IDS = new Set<number>([
  337170, 919207, 985939, // 365 Days trilogy
  250546, 339846, 399361, // Fifty Shades trilogy
  130392,                 // Sex/Life
  138843,                 // Below Her Mouth
  396422,                 // After
  537056, 613504, 718789, // After sequels (mais adultas)
  76600,                  // (placeholder seguro p/ ajustar)
]);
const HENTAI_KEYWORDS = /\b(hentai|ecchi|yaoi|yuri|h-anime|porn|xxx|overflow|mignon|adam[- ]?kun|modaete|no\s*love\s*zone|4\s*weeks?\s*lovers?|namoro\s*de\s*4\s*semanas)\b/i;
const MATURE_KEYWORDS = /\b(violent|gore|graphic|brutal|crime|drug|war|gangster)\b/i;
const MATURE_GENRE_IDS = new Set([10752, 80, 27, 53, 9648]);

function classifyMaturity(item: TmdbItem) {
  const text = `${item.title ?? ""} ${item.name ?? ""} ${item.overview ?? ""}`;
  const titleOnly = `${item.title ?? ""} ${item.name ?? ""}`;
  const explicit =
    !!item.adult ||
    EXPLICIT_BLACKLIST_IDS.has(item.id) ||
    EXPLICIT_TITLE_REGEX.test(titleOnly) ||
    EXPLICIT_KEYWORDS.test(text);
  const matureByGenre = (item.genre_ids ?? []).some((g) => MATURE_GENRE_IDS.has(g));
  const mature = explicit || matureByGenre || MATURE_KEYWORDS.test(text);
  return { explicit, mature };
}

function mapItem(item: TmdbItem, fallbackType?: "movie" | "tv", genres?: Record<number, string>): Media {
  const type: "movie" | "tv" = (item.media_type ?? fallbackType ?? (item.title ? "movie" : "tv")) as any;
  const title = item.title ?? item.name ?? "Sem título";
  const dateStr = item.release_date || item.first_air_date || "";
  const year = dateStr ? parseInt(dateStr.slice(0, 4), 10) : 0;
  const genreNames = (item.genre_ids ?? []).map((id) => (genres ? genres[id] : "")).filter(Boolean);
  const { explicit, mature } = classifyMaturity(item);
  const base: any = {
    id: item.id,
    type,
    title,
    overview: item.overview || "Sinopse indisponível.",
    posterUrl: img(item.poster_path) || img(item.backdrop_path),
    backdropUrl: img(item.backdrop_path, true) || img(item.poster_path, true),
    year: year || new Date().getFullYear(),
    rating: Math.round((item.vote_average ?? 0) * 10) / 10,
    genres: genreNames,
    adult: explicit,
    mature,
    originalLanguage: item.original_language,
    releaseDate: dateStr || undefined,
  };
  if (type === "tv") {
    base.seasons = [];
    base.totalSeasons = 0;
  }
  return base as Media;
}

/** Filtra itens não-lançados, sem sinopse e com poucos votos. */
function isReleased(item: TmdbItem): boolean {
  const date = item.release_date || item.first_air_date || "";
  if (!date) return false;
  return date <= TODAY;
}

function qualityFilter(item: TmdbItem, minVotes = 50, allowMissingOverview = false): boolean {
  if (!item.poster_path && !item.backdrop_path) return false;
  if (!allowMissingOverview) {
    if (!item.overview || item.overview.trim().length < 10) return false;
  }
  if ((item.vote_count ?? 0) < minVotes) return false;
  return true;
}

// Idiomas com áudio aceito (prioridade: pt-BR > pt-PT > en).
// Catálogos principais evitam línguas asiáticas para não misturar anime/donghua.
const ALLOWED_AUDIO_LANGS = new Set(["pt", "en"]);
const ANIMATION_GENRE_ID = 16;
const SOAP_GENRE_ID = 10766;
const KIDS_GENRE_ID = 10762;
const FAMILY_GENRE_ID = 10751;
const STRICT_SERIES_EXCLUDED_GENRES = [ANIMATION_GENRE_ID, SOAP_GENRE_ID, 10762, 10763, 10764, 10767].join(",");
const ASIAN_ANIME_LANGS = new Set(["ja", "ko", "zh", "cn"]);
const WESTERN_LIVE_LANGS = new Set(["en", "pt", "es", "fr", "it", "de", "nl", "sv", "da", "no", "fi", "pl"]);
const ANIME_LANG_VARIANTS = ["ja", "ko"];
const DONGHUA_LANG_VARIANTS = ["zh"];
const WESTERN_ANIMATION_LANG_VARIANTS = ["en", "pt", "es", "fr", "it", "de", "nl", "sv", "da", "no", "fi", "pl"];
const NOVELA_LANG_VARIANTS = ["pt", "es", "tr", "en", "it", "fr", "de", "ar", "hi", "tl"];
const CHINESE_DONGHUA_QUERY_LIST = [
  "Battle Through the Heavens",
  "Soul Land",
  "Perfect World",
  "Alchemy Supreme",
  "Swallowed Star",
  "A Record of a Mortal's Journey to Immortality",
  "Stellar Transformations",
  "Throne of Seal",
  "Martial Universe",
  "Renegade Immortal",
  "The Great Ruler",
  "The Demon Hunter",
];
const WESTERN_CARTOON_CHILD_EXCLUDE = /\b(rick\s*and\s*morty|futurama|invincible|arcane|south\s*park|family\s*guy|american\s*dad|bojack|simpsons?|big\s*mouth|solar\s*opposites|harley\s*quinn|castlevania|blood\s*of\s*zeus)\b/i;
const ASIAN_KID_CARTOON_EXCLUDE = /\b(robocar\s*poli|monkart|pororo|tayo|larva|super\s*wings|miniforce|babybus|cocomong|tobot|hello\s*carbot|duda\s*&?\s*dada|pinkfong)\b/i;
const DONGHUA_CULTIVATION_HINTS = /\b(cultivation|cultivator|xianxia|xuanhuan|martial|soul\s*land|douluo|alchemy|heaven|heavens|immortal|demon|sect|spirit|spiritual|realm|perfect\s*world|swallowed\s*star|stellar|throne\s*of\s*seal|battle\s*through|martial\s*universe|renegade\s*immortal|great\s*ruler|fantasia|artes\s*marciais|cultivo|alquimia|imortal|seita|reino\s*espiritual)\b/i;
const TOP_MOVIE_IDS = new Set([24428, 299536, 299534, 634649, 557, 558, 559, 293660, 533535, 19995, 603, 11, 155, 27205, 157336]);
const TOP_SERIES_IDS = new Set([76479, 94997, 75006, 66732, 82856, 85552, 84958, 1408, 1399, 1396, 63174, 1399, 1425, 60625]);
const TOP_ANIME_IDS = new Set([37854, 95479, 127532, 1429, 85937, 65930, 46260, 114410, 30984, 31911, 61222, 95557]);
const TOP_ANIMATION_IDS = new Set([862, 863, 10193, 2150, 809, 808, 585, 12, 129, 508442, 109445, 354912]);

function hasGenre(item: TmdbItem, genreId: number): boolean {
  return (item.genre_ids ?? []).includes(genreId);
}

function isAnimeItem(item: TmdbItem): boolean {
  const lang = (item.original_language || "").toLowerCase();
  const text = `${item.title ?? ""} ${item.name ?? ""} ${item.overview ?? ""}`;
  if (!hasGenre(item, ANIMATION_GENRE_ID) || !ASIAN_ANIME_LANGS.has(lang)) return false;
  if (ASIAN_KID_CARTOON_EXCLUDE.test(text)) return false;
  if (lang === "ja") return true;
  if (lang === "zh" || lang === "cn") return DONGHUA_CULTIVATION_HINTS.test(text) || !hasGenre(item, KIDS_GENRE_ID);
  if (lang === "ko") return !hasGenre(item, KIDS_GENRE_ID) && !hasGenre(item, FAMILY_GENRE_ID);
  return false;
}

function isWesternAnimationItem(item: TmdbItem): boolean {
  const lang = (item.original_language || "").toLowerCase();
  const text = `${item.title ?? ""} ${item.name ?? ""} ${item.overview ?? ""}`;
  return hasGenre(item, ANIMATION_GENRE_ID) && !!lang && !ASIAN_ANIME_LANGS.has(lang) &&
    (hasGenre(item, KIDS_GENRE_ID) || hasGenre(item, FAMILY_GENRE_ID)) &&
    !WESTERN_CARTOON_CHILD_EXCLUDE.test(text);
}

function isStrictMovieItem(item: TmdbItem): boolean {
  const lang = (item.original_language || "").toLowerCase();
  return !hasGenre(item, ANIMATION_GENRE_ID) && !isAnimeItem(item) && WESTERN_LIVE_LANGS.has(lang);
}

function isStrictSeriesItem(item: TmdbItem): boolean {
  const lang = (item.original_language || "").toLowerCase();
  return WESTERN_LIVE_LANGS.has(lang) && !hasGenre(item, ANIMATION_GENRE_ID) && !hasGenre(item, SOAP_GENRE_ID) &&
    ![10762, 10763, 10764, 10767].some((g) => hasGenre(item, g));
}

function isStrictNovelaItem(item: TmdbItem): boolean {
  return hasGenre(item, SOAP_GENRE_ID);
}

function hasAcceptedAudio(item: TmdbItem, allowJa = false, allowAny = false): boolean {
  if (allowAny) return true;
  const lang = (item.original_language || "").toLowerCase();
  if (ALLOWED_AUDIO_LANGS.has(lang)) return true;
  if (allowJa && lang === "ja") return true;
  return false;
}

function applyCatalogPriority(media: Media): Media {
  let priority = 0;
  if (media.type === "movie" && TOP_MOVIE_IDS.has(media.id)) priority += 10000;
  if (media.type === "tv" && TOP_SERIES_IDS.has(media.id)) priority += 10000;
  if (TOP_ANIME_IDS.has(media.id)) priority += 12000;
  if (TOP_ANIMATION_IDS.has(media.id)) priority += 9000;
  if (media.originalLanguage === "zh" || media.originalLanguage === "cn") priority -= 250;
  (media as any).catalogPriority = priority;
  return media;
}

async function mapList(
  items: TmdbItem[],
  fallbackType?: "movie" | "tv",
  opts?: { minVotes?: number; requireReleased?: boolean; allowJa?: boolean; allowReality?: boolean; allowHentai?: boolean; allowMissingOverview?: boolean; allowAnyLang?: boolean }
): Promise<Media[]> {
  const genres = await loadGenres();
  const minVotes = opts?.minVotes ?? 50;
  const requireReleased = opts?.requireReleased ?? true;
  const allowJa = opts?.allowJa ?? false;
  const allowReality = opts?.allowReality ?? false;
  const allowHentai = opts?.allowHentai ?? false;
  const allowMissingOverview = opts?.allowMissingOverview ?? true;
  const allowAnyLang = opts?.allowAnyLang ?? !requireReleased;
  return items
    .filter((i) => qualityFilter(i, minVotes, allowMissingOverview))
    .filter((i) => (requireReleased ? isReleased(i) : true))
    .filter((i) => hasAcceptedAudio(i, allowJa, allowAnyLang))
    .filter((i) => allowReality || !(i.genre_ids ?? []).includes(10764))
    .filter((i) => {
      if (allowHentai) return true;
      const text = `${i.title ?? ""} ${i.name ?? ""} ${i.overview ?? ""}`;
      return !HENTAI_KEYWORDS.test(text);
    })
    .map((i) => applyCatalogPriority(mapItem(i, fallbackType, genres)));
}

// ============ ENDPOINTS PAGINADOS ============

export async function fetchTrending(page = 1): Promise<Media[]> {
  const data = await tget<{ results: TmdbItem[] }>("/trending/all/week", { page });
  return mapList(data.results, undefined, { minVotes: 100 });
}
export async function fetchPopularMovies(page = 1): Promise<Media[]> {
  const sortModes = ["popularity.desc", "revenue.desc", "vote_count.desc", "primary_release_date.desc", "vote_average.desc"] as const;
  const sort = sortModes[(page - 1) % sortModes.length];
  const innerPage = Math.floor((page - 1) / sortModes.length) + 1;
  const data = await tget<{ results: TmdbItem[] }>("/discover/movie", {
    page: innerPage, sort_by: sort, without_genres: [ANIMATION_GENRE_ID, 99].join(","), with_original_language: page <= 120 ? "en" : undefined,
    "vote_count.gte": 0, "primary_release_date.lte": TODAY, include_adult: false,
  });
  return mapList(data.results.filter(isStrictMovieItem), "movie", { minVotes: 0, allowAnyLang: true, allowMissingOverview: true });
}
export async function fetchTopRatedMovies(page = 1): Promise<Media[]> {
  const data = await tget<{ results: TmdbItem[] }>("/discover/movie", {
    page, sort_by: "vote_average.desc", without_genres: ANIMATION_GENRE_ID,
    "vote_count.gte": 10, "primary_release_date.lte": TODAY, include_adult: false,
  });
  return mapList(data.results.filter(isStrictMovieItem), "movie", { minVotes: 10, allowAnyLang: true, allowMissingOverview: true });
}
export async function fetchPopularTv(page = 1): Promise<Media[]> {
  const sortModes = ["popularity.desc", "vote_count.desc", "first_air_date.desc", "vote_average.desc"] as const;
  const sort = sortModes[(page - 1) % sortModes.length];
  const innerPage = Math.floor((page - 1) / sortModes.length) + 1;
  const data = await tget<{ results: TmdbItem[] }>("/discover/tv", {
    page: innerPage, sort_by: sort, without_genres: STRICT_SERIES_EXCLUDED_GENRES, with_original_language: page <= 120 ? "en" : undefined,
    "vote_count.gte": 0, "first_air_date.lte": TODAY, include_adult: false,
  });
  return mapList(data.results.filter(isStrictSeriesItem), "tv", { minVotes: 0, allowAnyLang: true, allowMissingOverview: true });
}
export async function fetchTopRatedTv(page = 1): Promise<Media[]> {
  const data = await tget<{ results: TmdbItem[] }>("/discover/tv", {
    page, sort_by: "vote_average.desc", without_genres: STRICT_SERIES_EXCLUDED_GENRES,
    "vote_count.gte": 10, "first_air_date.lte": TODAY, include_adult: false,
  });
  return mapList(data.results.filter(isStrictSeriesItem), "tv", { minVotes: 10, allowAnyLang: true, allowMissingOverview: true });
}
export async function fetchNowPlaying(page = 1): Promise<Media[]> {
  // Lançamentos: combinamos /movie/now_playing + /tv/on_the_air e filtramos
  // somente conteúdo dos últimos 60 dias, ordenado do mais recente.
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [m, tv] = await Promise.all([
    tget<{ results: TmdbItem[] }>("/movie/now_playing", { page, region: REGION }),
    tget<{ results: TmdbItem[] }>("/tv/on_the_air", { page }),
  ]);
  const merged = [...m.results.map((r) => ({ ...r, media_type: "movie" as const })),
                  ...tv.results.map((r) => ({ ...r, media_type: "tv" as const }))];
  const recent = merged.filter((r) => {
    const d = r.release_date || r.first_air_date || "";
    return d >= sixtyDaysAgo && d <= TODAY;
  }).sort((a, b) => {
    const da = a.release_date || a.first_air_date || "";
    const db = b.release_date || b.first_air_date || "";
    return db.localeCompare(da);
  });
  return mapList(recent, undefined, { minVotes: 10 });
}
export async function fetchDocumentaries(page = 1): Promise<Media[]> {
  const data = await tget<{ results: TmdbItem[] }>("/discover/movie", {
    page, with_genres: 99, sort_by: "popularity.desc", "vote_count.gte": 50, "release_date.lte": TODAY,
  });
  return mapList(data.results, "movie", { minVotes: 50 });
}
export async function fetchAnimation(page = 1): Promise<Media[]> {
  // Desenhos: somente animação ocidental/infantil (filmes e TV), excluindo línguas asiáticas de anime.
  const sortModes = ["popularity.desc", "vote_count.desc", "first_air_date.desc", "vote_average.desc"] as const;
  const mediaKinds = ["tv", "movie"] as const;
  const variantCount = sortModes.length * WESTERN_ANIMATION_LANG_VARIANTS.length * mediaKinds.length;
  const variant = (page - 1) % variantCount;
  const baseSort = sortModes[variant % sortModes.length];
  const lang = WESTERN_ANIMATION_LANG_VARIANTS[Math.floor(variant / sortModes.length) % WESTERN_ANIMATION_LANG_VARIANTS.length];
  const kind = mediaKinds[Math.floor(variant / (sortModes.length * WESTERN_ANIMATION_LANG_VARIANTS.length)) % mediaKinds.length];
  const sort = kind === "movie" && baseSort === "first_air_date.desc" ? "primary_release_date.desc" : baseSort;
  const innerPage = Math.floor((page - 1) / variantCount) + 1;
  const dateKey = kind === "movie" ? "primary_release_date.lte" : "first_air_date.lte";
  const data = await tget<{ results: TmdbItem[] }>(`/discover/${kind}`, {
    page: innerPage, with_genres: ANIMATION_GENRE_ID, with_original_language: lang,
    sort_by: sort, "vote_count.gte": 0, [dateKey]: TODAY, include_adult: false,
  });
  return mapList(data.results.filter(isWesternAnimationItem), kind, { minVotes: 0, allowAnyLang: true, allowMissingOverview: true });
}
// Lista negra de TMDB IDs de animes com conteúdo sexual explícito.
// Mesmo que o TMDB retorne, são removidos antes de exibir.
export const ANIME_BLACKLIST_IDS = new Set<number>([
  90474,  // Overflow
  37578,  // Kiss x Sis
  75299,  // Domestic Girlfriend
  93571,  // Interspecies Reviewers
  110588, // Redo of Healer
  114797, // Emergence
  62741,  // High School DxD
  46298,  // Highschool of the Dead
  61374,  // Prison School
  76669,  // Shimoneta
  104158, // Ishuzoku Reviewers (alias)
  82684,  // To Love-Ru
  61443,  // Seikon no Qwaser
  46863,  // Why the Hell Are You Here, Teacher!?
  73223,  // How Not to Summon a Demon Lord
  37260,  // Manyuu Hikenchou
]);

// Lista negra por título (regex case-insensitive). Aplica-se a animes e
// pesquisa para garantir que conteúdos sinalizados como inadequados
// nunca apareçam, mesmo que o TMDB não os marque como adultos.
// Bloqueia hentai/ecchi pesado por título.
// Removidos da blacklist (mantidos no catálogo): sankarea, dragonaut, iwa kakeru, sport climbing girls.
export const ANIME_TITLE_BLACKLIST = /\b(takamine[- ]?san|please\s*put\s*them\s*on|girls?\s*bravo|harem\s*in\s*the\s*labyrinth|aika(\s*zero)?|why\s*the\s*hell\s*are\s*you\s*here|domestic\s*girlfriend|domestic\s*na\s*kanojo|how\s*not\s*to\s*summon\s*a\s*demon\s*lord|isekai\s*maou|manyuu|manyu)\b/i;

// Animes garantidos no catálogo (whitelist por TMDB ID).
export const ANIME_WHITELIST_IDS = [
  45782, // Shokugeki no Soma / Food Wars
];

function isBlacklistedAnime(item: TmdbItem): boolean {
  if (ANIME_BLACKLIST_IDS.has(item.id)) return true;
  const title = `${item.title ?? ""} ${item.name ?? ""}`;
  return ANIME_TITLE_BLACKLIST.test(title);
}

async function fetchTvByIds(ids: number[]): Promise<TmdbItem[]> {
  const out = await Promise.all(
    ids.map(async (id) => {
      try {
        const d = await tget<any>(`/tv/${id}`);
        return {
          id: d.id, name: d.name, overview: d.overview,
          poster_path: d.poster_path, backdrop_path: d.backdrop_path,
          first_air_date: d.first_air_date, vote_average: d.vote_average,
          vote_count: d.vote_count, original_language: d.original_language,
          genre_ids: (d.genres ?? []).map((g: any) => g.id), media_type: "tv",
        } as TmdbItem;
      } catch { return null; }
    })
  );
  return out.filter((x): x is TmdbItem => !!x);
}

async function fetchMovieByIds(ids: number[]): Promise<TmdbItem[]> {
  const out = await Promise.all(
    ids.map(async (id) => {
      try {
        const d = await tget<any>(`/movie/${id}`);
        return {
          id: d.id, title: d.title, overview: d.overview,
          poster_path: d.poster_path, backdrop_path: d.backdrop_path,
          release_date: d.release_date, vote_average: d.vote_average,
          vote_count: d.vote_count, original_language: d.original_language,
          genre_ids: (d.genres ?? []).map((g: any) => g.id), media_type: "movie",
        } as TmdbItem;
      } catch { return null; }
    })
  );
  return out.filter((x): x is TmdbItem => !!x);
}

function uniqueTmdbItems(items: TmdbItem[]): TmdbItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.media_type ?? (item.title ? "movie" : "tv")}:${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function fetchAnime(page = 1): Promise<Media[]> {
  // Animes: somente animações asiáticas (TV e filmes), com filtros relaxados para volume real.
  const sortModes = ["popularity.desc", "vote_average.desc", "first_air_date.desc", "vote_count.desc"] as const;
  const mediaKinds = ["tv", "movie"] as const;
  const variantCount = sortModes.length * ANIME_LANG_VARIANTS.length * mediaKinds.length;
  const variant = (page - 1) % variantCount;
  const baseSort = sortModes[variant % sortModes.length];
  const lang = ANIME_LANG_VARIANTS[Math.floor(variant / sortModes.length) % ANIME_LANG_VARIANTS.length];
  const kind = mediaKinds[Math.floor(variant / (sortModes.length * ANIME_LANG_VARIANTS.length)) % mediaKinds.length];
  const sort = kind === "movie" && baseSort === "first_air_date.desc" ? "primary_release_date.desc" : baseSort;
  const innerPage = Math.floor((page - 1) / variantCount) + 1;
  const dateKey = kind === "movie" ? "primary_release_date.lte" : "first_air_date.lte";
  const data = await tget<{ results: TmdbItem[] }>(`/discover/${kind}`, {
    page: innerPage,
    with_genres: ANIMATION_GENRE_ID,
    with_original_language: lang,
    include_adult: false,
    "vote_count.gte": 0,
    [dateKey]: TODAY,
    sort_by: sort,
  });
  let filtered = data.results.filter(
    (r) => isAnimeItem(r) && !r.adult && !isBlacklistedAnime(r)
  );
  if (page === 1) {
    const whitelist = await fetchTvByIds(ANIME_WHITELIST_IDS);
    const existingIds = new Set(filtered.map((f) => f.id));
    filtered = [...whitelist.filter((w) => !existingIds.has(w.id)), ...filtered];
  }
  return mapList(filtered, kind, {
    minVotes: 0,
    requireReleased: true,
    allowJa: true,
    allowHentai: false,
    allowAnyLang: true,
    allowMissingOverview: true,
  });
}
// Reality removido: stub mantido vazio para retrocompatibilidade.
export async function fetchReality(_page = 1): Promise<Media[]> {
  return [];
}

// ============ NOVELAS ============
// 400 internacionais (pt/es/en/ko, soap opera) + 400 turcas (drama tr).
// Cada loader paginado retorna ~20 por página. Páginas 1-20 = 400 itens.
export async function fetchNovelasInternational(page = 1): Promise<Media[]> {
  // Somente soap opera/telenovela; vários idiomas e sorts para volume sem virar séries comuns.
  const langs = NOVELA_LANG_VARIANTS;
  const sorts = ["popularity.desc", "first_air_date.desc", "vote_count.desc"] as const;
  const variant = (page - 1) % (langs.length * sorts.length);
  const lang = langs[variant % langs.length];
  const sort = sorts[Math.floor(variant / langs.length) % sorts.length];
  const innerPage = Math.floor((page - 1) / (langs.length * sorts.length)) + 1;
  const data = await tget<{ results: TmdbItem[] }>("/discover/tv", {
    page: innerPage, with_genres: SOAP_GENRE_ID, with_original_language: lang,
    sort_by: sort, "vote_count.gte": 0,
    "first_air_date.gte": "1970-01-01", "first_air_date.lte": TODAY,
  });
  return mapList(data.results.filter(isStrictNovelaItem), "tv", { minVotes: 0, allowAnyLang: true, allowMissingOverview: true });
}
export async function fetchNovelasTurkish(page = 1): Promise<Media[]> {
  const sorts = ["popularity.desc", "first_air_date.desc", "vote_count.desc"] as const;
  const sort = sorts[(page - 1) % sorts.length];
  const innerPage = Math.floor((page - 1) / sorts.length) + 1;
  const data = await tget<{ results: TmdbItem[] }>("/discover/tv", {
    page: innerPage, with_original_language: "tr", with_genres: SOAP_GENRE_ID,
    sort_by: sort, "vote_count.gte": 0,
    "first_air_date.lte": TODAY,
  });
  return mapList(data.results.filter(isStrictNovelaItem), "tv", { minVotes: 0, allowAnyLang: true, allowMissingOverview: true });
}
export async function fetchNovelas(page = 1): Promise<Media[]> {
  if (page % 2 === 1) return fetchNovelasInternational(Math.ceil(page / 2));
  return fetchNovelasTurkish(page / 2);
}
export async function fetchModernClassics(page = 1): Promise<Media[]> {
  const data = await tget<{ results: TmdbItem[] }>("/discover/movie", {
    page, sort_by: "vote_average.desc", "vote_count.gte": 1000,
    "primary_release_date.gte": "2000-01-01", "primary_release_date.lte": "2015-12-31",
  });
  return mapList(data.results, "movie", { minVotes: 1000 });
}
export async function fetchAdultMovies(page = 1): Promise<Media[]> {
  const data = await tget<{ results: TmdbItem[] }>("/discover/movie", {
    page, with_genres: "18,53,27,80", "vote_average.gte": 6, "vote_count.gte": 100,
    sort_by: "popularity.desc", include_adult: true, "release_date.lte": TODAY,
  });
  return mapList(data.results, "movie", { minVotes: 100 });
}
export async function fetchExplicitMovies(page = 1): Promise<Media[]> {
  const data = await tget<{ results: TmdbItem[] }>("/discover/movie", {
    page, sort_by: "popularity.desc", include_adult: true,
    with_keywords: "190370|268782|6149", "vote_count.gte": 10,
  });
  return mapList(data.results, "movie", { minVotes: 10 });
}
export async function fetchUpcomingMovies(page = 1): Promise<Media[]> {
  const data = await tget<{ results: TmdbItem[] }>("/discover/movie", {
    page, sort_by: "primary_release_date.asc", "primary_release_date.gte": TODAY,
    without_genres: ANIMATION_GENRE_ID, region: REGION, include_adult: false,
    "vote_count.gte": 0,
  });
  return mapList(data.results.filter(isStrictMovieItem), "movie", { minVotes: 0, requireReleased: false });
}
export async function fetchUpcomingTv(page = 1): Promise<Media[]> {
  const data = await tget<{ results: TmdbItem[] }>("/discover/tv", {
    page, sort_by: "first_air_date.asc", "first_air_date.gte": TODAY,
    without_genres: STRICT_SERIES_EXCLUDED_GENRES, include_adult: false,
  });
  return mapList(data.results.filter(isStrictSeriesItem), "tv", { minVotes: 0, requireReleased: false });
}
export async function fetchUpcomingAnime(page = 1): Promise<Media[]> {
  const mediaKinds = ["tv", "movie"] as const;
  const variant = (page - 1) % (ANIME_LANG_VARIANTS.length * mediaKinds.length);
  const lang = ANIME_LANG_VARIANTS[variant % ANIME_LANG_VARIANTS.length];
  const kind = mediaKinds[Math.floor(variant / ANIME_LANG_VARIANTS.length) % mediaKinds.length];
  const innerPage = Math.floor((page - 1) / (ANIME_LANG_VARIANTS.length * mediaKinds.length)) + 1;
  const dateKey = kind === "movie" ? "primary_release_date.gte" : "first_air_date.gte";
  const data = await tget<{ results: TmdbItem[] }>(`/discover/${kind}`, {
    page: innerPage, with_genres: ANIMATION_GENRE_ID, with_original_language: lang,
    sort_by: kind === "movie" ? "primary_release_date.asc" : "first_air_date.asc", [dateKey]: TODAY, include_adult: false,
  });
  const filtered = data.results.filter(
    (r) => isAnimeItem(r) && !isBlacklistedAnime(r)
  );
  return mapList(filtered, kind, { minVotes: 0, requireReleased: false, allowJa: true, allowAnyLang: true });
}
export async function fetchUpcomingAnimation(page = 1): Promise<Media[]> {
  const mediaKinds = ["tv", "movie"] as const;
  const variant = (page - 1) % (WESTERN_ANIMATION_LANG_VARIANTS.length * mediaKinds.length);
  const lang = WESTERN_ANIMATION_LANG_VARIANTS[variant % WESTERN_ANIMATION_LANG_VARIANTS.length];
  const kind = mediaKinds[Math.floor(variant / WESTERN_ANIMATION_LANG_VARIANTS.length) % mediaKinds.length];
  const innerPage = Math.floor((page - 1) / (WESTERN_ANIMATION_LANG_VARIANTS.length * mediaKinds.length)) + 1;
  const dateKey = kind === "movie" ? "primary_release_date.gte" : "first_air_date.gte";
  const data = await tget<{ results: TmdbItem[] }>(`/discover/${kind}`, {
    page: innerPage, with_genres: ANIMATION_GENRE_ID, with_original_language: lang,
    sort_by: kind === "movie" ? "primary_release_date.asc" : "first_air_date.asc", [dateKey]: TODAY, include_adult: false,
  });
  return mapList(data.results.filter(isWesternAnimationItem), kind, { minVotes: 0, requireReleased: false, allowAnyLang: true });
}

// Loader auxiliar para pesquisa multi-página agregando popular + top_rated
function combineLoaders(...loaders: Array<(p: number) => Promise<Media[]>>): (page: number) => Promise<Media[]> {
  return async (page: number) => {
    const idx = (page - 1) % loaders.length;
    const inner = Math.floor((page - 1) / loaders.length) + 1;
    return loaders[idx](inner);
  };
}

export const fetchAllMovies = combineLoaders(fetchPopularMovies, fetchTopRatedMovies);
export const fetchAllTv = combineLoaders(fetchPopularTv, fetchTopRatedTv);

export type RowLoader = (page: number) => Promise<Media[]>;

export interface RowDef {
  id: string;
  title: string;
  loader: RowLoader;
  audience?: "all" | "mature" | "explicit";
}

export const ALL_ROWS: RowDef[] = [
  { id: "trending", title: "Em Alta Esta Semana", loader: fetchTrending },
  { id: "now", title: "Lançamentos", loader: fetchNowPlaying },
  { id: "movies", title: "Filmes Populares", loader: fetchPopularMovies },
  { id: "series", title: "Séries Populares", loader: fetchPopularTv },
  { id: "novelas", title: "Novelas em Destaque", loader: fetchNovelas },
  { id: "anime", title: "Animes em Alta", loader: fetchAnime },
  { id: "animation", title: "Desenhos Animados", loader: fetchAnimation },
  { id: "docs", title: "Documentários", loader: fetchDocumentaries },
  { id: "classics", title: "Clássicos Modernos", loader: fetchModernClassics },
  { id: "mature", title: "Conteúdo +18", loader: fetchAdultMovies, audience: "mature" },
  { id: "explicit", title: "Adulto Explícito", loader: fetchExplicitMovies, audience: "explicit" },
];

export async function fetchHomeRowsTmdb(): Promise<ContentRow[]> {
  const baseRows = ALL_ROWS.filter((r) => !r.audience || r.audience === "all");
  const items = await Promise.all(baseRows.map((r) => r.loader(1).catch(() => [])));
  return baseRows.map((r, i) => ({ id: r.id, title: r.title, items: items[i].slice(0, 10) }));
}

export async function fetchHeroPool(): Promise<Media[]> {
  // 6 destaques pra rotação do hero. Oversample 5 páginas e deduplica
  // para garantir 6 itens válidos mesmo após filtros de maturidade.
  const [p1, p2, p3, p4, p5] = await Promise.all([
    fetchTrending(1).catch(() => []),
    fetchTrending(2).catch(() => []),
    fetchPopularMovies(1).catch(() => []),
    fetchPopularTv(1).catch(() => []),
    fetchTopRatedMovies(1).catch(() => []),
  ]);
  const seen = new Set<number>();
  const merged: Media[] = [];
  for (const m of [...p1, ...p2, ...p3, ...p4, ...p5]) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    if (!m.backdropUrl) continue;
    merged.push(m);
    if (merged.length >= 12) break;
  }
  return merged.slice(0, 12);
}

// ============ Contadores totais por categoria ============
// Conta via TMDB usando os mesmos filtros dos respectivos loaders (total_results).
async function countDiscover(
  kind: "movie" | "tv",
  params: Record<string, string | number | boolean | undefined>
): Promise<number> {
  try {
    const data = await tget<{ total_results?: number }>(`/discover/${kind}`, { ...params, page: 1 });
    return data.total_results ?? 0;
  } catch {
    return 0;
  }
}
export async function countMovies(): Promise<number> {
  return countDiscover("movie", {
    sort_by: "popularity.desc", without_genres: ANIMATION_GENRE_ID,
    "vote_count.gte": 0, "primary_release_date.lte": TODAY, include_adult: false,
  });
}
export async function countSeries(): Promise<number> {
  return countDiscover("tv", {
    sort_by: "popularity.desc", without_genres: STRICT_SERIES_EXCLUDED_GENRES,
    "vote_count.gte": 0, "first_air_date.lte": TODAY, include_adult: false,
  });
}
export async function countAnime(): Promise<number> {
  const counts = await Promise.all(ANIME_LANG_VARIANTS.flatMap((lang) =>
    (["tv", "movie"] as const).map((kind) => countDiscover(kind, {
      with_genres: ANIMATION_GENRE_ID, with_original_language: lang, include_adult: false,
      "vote_count.gte": 0, [kind === "movie" ? "primary_release_date.lte" : "first_air_date.lte"]: TODAY,
    }))
  ));
  return counts.reduce((a, b) => a + b, 0);
}
export async function countAnimation(): Promise<number> {
  const counts = await Promise.all(WESTERN_ANIMATION_LANG_VARIANTS.flatMap((lang) =>
    (["tv", "movie"] as const).map((kind) => countDiscover(kind, {
      with_genres: ANIMATION_GENRE_ID, with_original_language: lang,
      "vote_count.gte": 0, [kind === "movie" ? "primary_release_date.lte" : "first_air_date.lte"]: TODAY,
      include_adult: false,
    }))
  ));
  return counts.reduce((a, b) => a + b, 0);
}
export async function countNovelas(): Promise<number> {
  const intl = await Promise.all(NOVELA_LANG_VARIANTS.map((lang) =>
    countDiscover("tv", {
      with_genres: SOAP_GENRE_ID, with_original_language: lang,
      "vote_count.gte": 0, "first_air_date.gte": "1970-01-01", "first_air_date.lte": TODAY,
    })
  ));
  return intl.reduce((a, b) => a + b, 0);
}

export async function fetchMovieDetail(id: number): Promise<Movie | null> {
  try {
    const data = await tget<any>(`/movie/${id}`, { append_to_response: "translations" });
    const genres: Record<number, string> = {};
    (data.genres ?? []).forEach((g: any) => (genres[g.id] = g.name));
    const m = mapItem({ ...data, genre_ids: (data.genres ?? []).map((g: any) => g.id) }, "movie", genres) as Movie;
    if (data.runtime) (m as any).duration = `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}min`;
    (m as any).audioLanguages = (data.spoken_languages ?? []).map((l: any) => l.iso_639_1).filter(Boolean);
    (m as any).subtitleLanguages = (data.translations?.translations ?? []).map((t: any) => t.iso_639_1).filter(Boolean);
    return m;
  } catch { return null; }
}

export async function fetchTvDetail(id: number): Promise<Series | null> {
  try {
    const data = await tget<any>(`/tv/${id}`, { append_to_response: "translations" });
    const genres: Record<number, string> = {};
    (data.genres ?? []).forEach((g: any) => (genres[g.id] = g.name));
    const base = mapItem(
      { ...data, genre_ids: (data.genres ?? []).map((g: any) => g.id) },
      "tv", genres
    ) as Series;
    base.totalSeasons = data.number_of_seasons ?? 0;
    (base as any).duration = `${data.number_of_seasons ?? 1} Temporadas`;
    base.seasons = (data.seasons ?? [])
      .filter((s: any) => s.season_number >= 1)
      .map((s: any): Season => ({
        number: s.season_number,
        title: s.name ?? `Temporada ${s.season_number}`,
        episodes: [],
        episodeCount: s.episode_count ?? 0,
      } as Season));
    if (base.seasons[0]) {
      const eps = await fetchSeasonEpisodes(id, base.seasons[0].number);
      base.seasons[0].episodes = eps;
    }
    (base as any).audioLanguages = (data.spoken_languages ?? data.languages ?? [])
      .map((l: any) => (typeof l === "string" ? l : l.iso_639_1)).filter(Boolean);
    (base as any).subtitleLanguages = (data.translations?.translations ?? [])
      .map((t: any) => t.iso_639_1).filter(Boolean);
    return base;
  } catch { return null; }
}

// ============ Watch providers (streaming disponível por região) ============
export interface ProviderInfo {
  id: number;
  name: string;
  logoUrl: string;
}

const providersCache = new Map<string, ProviderInfo[]>();

export async function fetchWatchProviders(
  type: "movie" | "tv",
  id: number,
  region: string = REGION
): Promise<ProviderInfo[]> {
  const key = `${type}:${id}:${region}`;
  if (providersCache.has(key)) return providersCache.get(key)!;
  try {
    const data = await tget<any>(`/${type}/${id}/watch/providers`);
    const r = data.results?.[region] ?? data.results?.US;
    if (!r) {
      providersCache.set(key, []);
      return [];
    }
    const seen = new Set<number>();
    const merged: ProviderInfo[] = [];
    for (const list of [r.flatrate, r.free, r.ads, r.buy, r.rent]) {
      for (const p of list ?? []) {
        if (seen.has(p.provider_id)) continue;
        seen.add(p.provider_id);
        merged.push({
          id: p.provider_id,
          name: p.provider_name,
          logoUrl: `https://image.tmdb.org/t/p/w92${p.logo_path}`,
        });
      }
    }
    providersCache.set(key, merged);
    return merged;
  } catch {
    return [];
  }
}

export async function fetchSeasonEpisodes(tvId: number, season: number): Promise<Episode[]> {
  try {
    const data = await tget<any>(`/tv/${tvId}/season/${season}`);
    return (data.episodes ?? []).map((e: any): Episode => ({
      id: e.id,
      number: e.episode_number,
      title: e.name ?? `Episódio ${e.episode_number}`,
      overview: e.overview || "Sinopse indisponível.",
      duration: e.runtime ? `${e.runtime}min` : "—",
      stillUrl: img(e.still_path) || img(e.poster_path),
    }));
  } catch { return []; }
}

export async function fetchMediaUnknown(id: number): Promise<Media | null> {
  const m = await fetchMovieDetail(id);
  if (m) return m;
  return fetchTvDetail(id);
}

// ============ Search com cache em memória ============
const searchCache = new Map<string, { ts: number; results: Media[] }>();
const SEARCH_TTL = 5 * 60 * 1000;

export async function searchTmdb(query: string): Promise<Media[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const cached = searchCache.get(q);
  if (cached && Date.now() - cached.ts < SEARCH_TTL) return cached.results;
  const data = await tget<{ results: TmdbItem[] }>("/search/multi", { query: q, include_adult: false });
  const filtered = data.results
    .filter((r: any) => r.media_type === "movie" || r.media_type === "tv")
    .filter((r: any) => !isBlacklistedAnime(r));
  const results = await mapList(filtered, undefined, { minVotes: 0, requireReleased: false, allowJa: true });
  searchCache.set(q, { ts: Date.now(), results });
  return results;
}

// ============ Coleções ============

export interface CollectionInfo {
  id: number;
  name: string;
  overview?: string;
  posterUrl: string;
  backdropUrl: string;
  count: number;
  parts: Movie[];
}

export const FEATURED_COLLECTIONS: { id: number; name: string }[] = [
  { id: 86311, name: "Vingadores" },
  { id: 131295, name: "Homem de Ferro" },
  { id: 131296, name: "Capitão América" },
  { id: 131292, name: "Thor" },
  { id: 422834, name: "Homem-Formiga" },
  { id: 284433, name: "Guardiões da Galáxia" },
  { id: 556, name: "Homem-Aranha (Sam Raimi)" },
  { id: 314979, name: "O Espetacular Homem-Aranha" },
  { id: 531241, name: "Homem-Aranha (MCU)" },
  { id: 1241, name: "Harry Potter" },
  { id: 435259, name: "Animais Fantásticos" },
  { id: 119, name: "O Senhor dos Anéis" },
  { id: 121938, name: "O Hobbit" },
  { id: 10, name: "Star Wars" },
  { id: 404609, name: "John Wick" },
  { id: 87359, name: "Missão: Impossível" },
  { id: 9485, name: "Velozes & Furiosos" },
  { id: 2602, name: "Pânico" },
  { id: 8945, name: "Premonição" },
  { id: 2344, name: "Matrix" },
  { id: 8650, name: "Transformers" },
  { id: 748, name: "X-Men" },
  { id: 263, name: "Trilogia Cavaleiro das Trevas" },
  { id: 120794, name: "Batman" },
  { id: 468552, name: "Liga da Justiça (DCEU)" },
  { id: 2150, name: "Shrek" },
  { id: 10194, name: "Toy Story" },
  { id: 386382, name: "Frozen" },
  { id: 295, name: "Piratas do Caribe" },
  { id: 1570, name: "Duro de Matar" },
  { id: 645, name: "James Bond" },
  { id: 528, name: "O Exterminador do Futuro" },
  { id: 87096, name: "Avatar" },
  { id: 304, name: "Onze Homens e um Segredo" },
  { id: 33514, name: "Karate Kid" },
];

export async function fetchCollection(id: number): Promise<CollectionInfo | null> {
  try {
    const data = await tget<any>(`/collection/${id}`);
    const genres = await loadGenres();
    const parts: Movie[] = (data.parts ?? [])
      .filter((p: any) => p.poster_path || p.backdrop_path)
      .map((p: any) => mapItem(p, "movie", genres) as Movie)
      .sort((a: Movie, b: Movie) => a.year - b.year);
    return {
      id: data.id,
      name: data.name,
      overview: data.overview,
      posterUrl: img(data.poster_path),
      backdropUrl: img(data.backdrop_path, true) || img(data.poster_path, true),
      count: parts.length,
      parts,
    };
  } catch { return null; }
}

export async function fetchFeaturedCollections(): Promise<CollectionInfo[]> {
  const list = await Promise.all(FEATURED_COLLECTIONS.map((c) => fetchCollection(c.id).catch(() => null)));
  return list.filter((c): c is CollectionInfo => !!c && c.count > 0);
}

/** Player VidSrc */
export function buildPlayerUrl(media: Media, episode?: { season?: number; number: number } | null): string {
  if (media.type === "movie") {
    return `https://vidsrc.xyz/embed/movie?tmdb=${media.id}`;
  }
  const s = episode?.season ?? 1;
  const e = episode?.number ?? 1;
  return `https://vidsrc.xyz/embed/tv?tmdb=${media.id}&season=${s}&episode=${e}`;
}

// ============ Elenco (TMDB credits) ============
export interface CastMember {
  id: number;
  name: string;
  character: string;
  profileUrl: string;
  order: number;
}

export async function fetchCredits(type: "movie" | "tv", id: number): Promise<CastMember[]> {
  try {
    const data = await tget<any>(`/${type}/${id}/credits`);
    const cast = (data.cast ?? []) as any[];
    return cast
      .map((c) => ({
        id: c.id,
        name: c.name ?? "—",
        character: c.character ?? "",
        profileUrl: c.profile_path
          ? `https://image.tmdb.org/t/p/w185${c.profile_path}`
          : "",
        order: c.order ?? 999,
      }))
      .sort((a, b) => a.order - b.order);
  } catch {
    return [];
  }
}

// ============ Semelhantes / Recomendados ============
export async function fetchSimilarMixed(
  type: "movie" | "tv",
  id: number,
  minCount = 30
): Promise<Media[]> {
  const genres = await loadGenres();
  const seen = new Set<number>([id]);
  const candidates: { item: TmdbItem; type: "movie" | "tv" }[] = [];

  // 1) Detalhes do conteúdo atual para extrair gêneros de referência.
  let refGenreIds: number[] = [];
  try {
    const detail = await tget<any>(`/${type}/${id}`);
    refGenreIds = (detail.genres ?? []).map((g: any) => g.id);
  } catch {}
  const refGenreSet = new Set(refGenreIds);

  const push = (items: TmdbItem[], fallback: "movie" | "tv") => {
    for (const it of items) {
      if (seen.has(it.id)) continue;
      if (!it.poster_path && !it.backdrop_path) continue;
      if (isBlacklistedAnime(it)) continue;
      seen.add(it.id);
      candidates.push({ item: it, type: fallback });
    }
  };

  // 2) Recomendações TMDB (mesmo tipo) — prioridade máxima.
  try {
    const d = await tget<{ results: TmdbItem[] }>(`/${type}/${id}/recommendations`, { page: 1 });
    push(d.results, type);
  } catch {}

  // 3) Discover por gêneros — filme E série, com filtro de qualidade.
  if (refGenreIds.length > 0) {
    const genreParam = refGenreIds.slice(0, 3).join(",");
    for (const otherType of ["movie", "tv"] as const) {
      try {
        const d = await tget<{ results: TmdbItem[] }>(`/discover/${otherType}`, {
          with_genres: genreParam,
          sort_by: "popularity.desc",
          "vote_count.gte": 50,
          "vote_average.gte": 5,
        });
        push(d.results, otherType);
      } catch {}
    }
  }

  // 4) Fallback /similar (geralmente ruim, mas garante volume).
  if (candidates.length < minCount) {
    try {
      const d = await tget<{ results: TmdbItem[] }>(`/${type}/${id}/similar`, { page: 1 });
      push(d.results, type);
    } catch {}
  }

  // 5) Pontuação por overlap de gêneros + popularidade.
  const scored = candidates.map(({ item, type: t }) => {
    const overlap = (item.genre_ids ?? []).filter((g) => refGenreSet.has(g)).length;
    const pop = (item.vote_count ?? 0);
    return { item, type: t, score: overlap * 1000 + Math.min(pop, 5000) };
  });
  scored.sort((a, b) => b.score - a.score);

  // Filtra: precisa ter pelo menos 1 gênero em comum (quando há referência).
  const filtered = refGenreIds.length > 0
    ? scored.filter((s) => (s.item.genre_ids ?? []).some((g) => refGenreSet.has(g)))
    : scored;

  // Garante mínimo: se filtro estrito remove muito, completa com top-pop.
  const finalList = filtered.length >= 10 ? filtered : scored;

  return finalList.slice(0, Math.max(minCount, 30)).map((s) => mapItem(s.item, s.type, genres));
}

// ============ Em Breve por ano específico ============
function yearRange(year: number): { gte: string; lte: string } {
  return { gte: `${year}-01-01`, lte: `${year}-12-31` };
}

export async function fetchUpcomingMoviesByYear(year: number, page = 1): Promise<Media[]> {
  const { gte, lte } = yearRange(year);
  const data = await tget<{ results: TmdbItem[] }>("/discover/movie", {
    page, sort_by: "primary_release_date.asc",
    "primary_release_date.gte": gte, "primary_release_date.lte": lte,
    without_genres: ANIMATION_GENRE_ID, include_adult: false,
  });
  return mapList(data.results.filter(isStrictMovieItem), "movie", { minVotes: 0, requireReleased: false });
}
export async function fetchUpcomingTvByYear(year: number, page = 1): Promise<Media[]> {
  const { gte, lte } = yearRange(year);
  const data = await tget<{ results: TmdbItem[] }>("/discover/tv", {
    page, sort_by: "first_air_date.asc",
    "first_air_date.gte": gte, "first_air_date.lte": lte,
    without_genres: STRICT_SERIES_EXCLUDED_GENRES, include_adult: false,
  });
  return mapList(data.results.filter(isStrictSeriesItem), "tv", { minVotes: 0, requireReleased: false });
}
export async function fetchUpcomingAnimeByYear(year: number, page = 1): Promise<Media[]> {
  const { gte, lte } = yearRange(year);
  const mediaKinds = ["tv", "movie"] as const;
  const variant = (page - 1) % (ANIME_LANG_VARIANTS.length * mediaKinds.length);
  const lang = ANIME_LANG_VARIANTS[variant % ANIME_LANG_VARIANTS.length];
  const kind = mediaKinds[Math.floor(variant / ANIME_LANG_VARIANTS.length) % mediaKinds.length];
  const innerPage = Math.floor((page - 1) / (ANIME_LANG_VARIANTS.length * mediaKinds.length)) + 1;
  const data = await tget<{ results: TmdbItem[] }>(`/discover/${kind}`, {
    page: innerPage, with_genres: ANIMATION_GENRE_ID, with_original_language: lang,
    sort_by: kind === "movie" ? "primary_release_date.asc" : "first_air_date.asc",
    [kind === "movie" ? "primary_release_date.gte" : "first_air_date.gte"]: gte,
    [kind === "movie" ? "primary_release_date.lte" : "first_air_date.lte"]: lte,
    include_adult: false,
  });
  const filtered = data.results.filter((r) => isAnimeItem(r) && !isBlacklistedAnime(r));
  return mapList(filtered, kind, { minVotes: 0, requireReleased: false, allowJa: true, allowAnyLang: true });
}
export async function fetchUpcomingAnimationByYear(year: number, page = 1): Promise<Media[]> {
  const { gte, lte } = yearRange(year);
  const mediaKinds = ["tv", "movie"] as const;
  const variant = (page - 1) % (WESTERN_ANIMATION_LANG_VARIANTS.length * mediaKinds.length);
  const lang = WESTERN_ANIMATION_LANG_VARIANTS[variant % WESTERN_ANIMATION_LANG_VARIANTS.length];
  const kind = mediaKinds[Math.floor(variant / WESTERN_ANIMATION_LANG_VARIANTS.length) % mediaKinds.length];
  const innerPage = Math.floor((page - 1) / (WESTERN_ANIMATION_LANG_VARIANTS.length * mediaKinds.length)) + 1;
  const data = await tget<{ results: TmdbItem[] }>(`/discover/${kind}`, {
    page: innerPage, with_genres: ANIMATION_GENRE_ID, with_original_language: lang,
    sort_by: kind === "movie" ? "primary_release_date.asc" : "first_air_date.asc",
    [kind === "movie" ? "primary_release_date.gte" : "first_air_date.gte"]: gte,
    [kind === "movie" ? "primary_release_date.lte" : "first_air_date.lte"]: lte,
    include_adult: false,
  });
  return mapList(data.results.filter(isWesternAnimationItem), kind, { minVotes: 0, requireReleased: false, allowAnyLang: true });
}

export async function fetchUpcomingNovelasByYear(year: number, page = 1): Promise<Media[]> {
  const { gte, lte } = yearRange(year);
  const langs = NOVELA_LANG_VARIANTS;
  const lang = langs[(page - 1) % langs.length];
  const innerPage = Math.floor((page - 1) / langs.length) + 1;
  const data = await tget<{ results: TmdbItem[] }>("/discover/tv", {
    page: innerPage,
    with_original_language: lang,
    with_genres: SOAP_GENRE_ID,
    sort_by: "first_air_date.asc",
    "first_air_date.gte": gte, "first_air_date.lte": lte,
  });
  const genres = await loadGenres();
  return data.results
    .filter((i) => (i.poster_path || i.backdrop_path) && isStrictNovelaItem(i))
    .map((i) => mapItem(i, "tv", genres));
}

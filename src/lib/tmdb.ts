// TMDB client — catálogo expandido com filtros, paginação, coleções e novas seções.

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

async function tget<T = any>(path: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", TMDB_API_KEY);
  url.searchParams.set("language", LANG);
  for (const [k, v] of Object.entries(params)) {
    if (v != null) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB ${path} -> ${res.status}`);
  return res.json();
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

const EXPLICIT_KEYWORDS = /\b(erotic|softcore|hardcore|sex|nudit|porn|xxx|adult|hentai|ecchi)\b/i;
const HENTAI_KEYWORDS = /\b(hentai|ecchi|yaoi|yuri|h-anime|porn|xxx)\b/i;
const MATURE_KEYWORDS = /\b(violent|gore|graphic|brutal|crime|drug|war|gangster)\b/i;
const MATURE_GENRE_IDS = new Set([10752, 80, 27, 53, 9648]);

function classifyMaturity(item: TmdbItem) {
  const text = `${item.title ?? ""} ${item.name ?? ""} ${item.overview ?? ""}`;
  const explicit = !!item.adult || EXPLICIT_KEYWORDS.test(text);
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

function qualityFilter(item: TmdbItem, minVotes = 50): boolean {
  if (!item.poster_path && !item.backdrop_path) return false;
  if (!item.overview || item.overview.trim().length < 10) return false;
  if ((item.vote_count ?? 0) < minVotes) return false;
  return true;
}

// Idiomas com áudio aceito (prioridade: pt-BR > pt-PT > en).
// "ja" é mantido apenas em listas de anime (que filtram explicitamente para ja).
const ALLOWED_AUDIO_LANGS = new Set(["pt", "en"]);

function hasAcceptedAudio(item: TmdbItem, allowJa = false): boolean {
  const lang = (item.original_language || "").toLowerCase();
  if (ALLOWED_AUDIO_LANGS.has(lang)) return true;
  if (allowJa && lang === "ja") return true;
  return false;
}

async function mapList(
  items: TmdbItem[],
  fallbackType?: "movie" | "tv",
  opts?: { minVotes?: number; requireReleased?: boolean; allowJa?: boolean; allowReality?: boolean; allowHentai?: boolean }
): Promise<Media[]> {
  const genres = await loadGenres();
  const minVotes = opts?.minVotes ?? 50;
  const requireReleased = opts?.requireReleased ?? true;
  const allowJa = opts?.allowJa ?? false;
  const allowReality = opts?.allowReality ?? false;
  const allowHentai = opts?.allowHentai ?? false;
  return items
    .filter((i) => qualityFilter(i, minVotes))
    .filter((i) => (requireReleased ? isReleased(i) : true))
    .filter((i) => hasAcceptedAudio(i, allowJa))
    .filter((i) => allowReality || !(i.genre_ids ?? []).includes(10764))
    .filter((i) => {
      if (allowHentai) return true;
      const text = `${i.title ?? ""} ${i.name ?? ""} ${i.overview ?? ""}`;
      return !HENTAI_KEYWORDS.test(text);
    })
    .map((i) => mapItem(i, fallbackType, genres));
}

// ============ ENDPOINTS PAGINADOS ============

export async function fetchTrending(page = 1): Promise<Media[]> {
  const data = await tget<{ results: TmdbItem[] }>("/trending/all/week", { page });
  return mapList(data.results, undefined, { minVotes: 100 });
}
export async function fetchPopularMovies(page = 1): Promise<Media[]> {
  const data = await tget<{ results: TmdbItem[] }>("/discover/movie", {
    page, sort_by: "popularity.desc", "vote_count.gte": 100, "vote_average.gte": 5,
    "release_date.lte": TODAY, region: REGION,
  });
  return mapList(data.results, "movie", { minVotes: 100 });
}
export async function fetchTopRatedMovies(page = 1): Promise<Media[]> {
  const data = await tget<{ results: TmdbItem[] }>("/movie/top_rated", { page });
  return mapList(data.results, "movie", { minVotes: 200 });
}
export async function fetchPopularTv(page = 1): Promise<Media[]> {
  const data = await tget<{ results: TmdbItem[] }>("/discover/tv", {
    page, sort_by: "popularity.desc", "vote_count.gte": 100, "vote_average.gte": 5,
    "first_air_date.lte": TODAY,
  });
  return mapList(data.results, "tv", { minVotes: 100 });
}
export async function fetchTopRatedTv(page = 1): Promise<Media[]> {
  const data = await tget<{ results: TmdbItem[] }>("/tv/top_rated", { page });
  return mapList(data.results, "tv", { minVotes: 200 });
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
  // Desenhos: animação TV NÃO-japonesa. Filtro duplo cliente-side garante exclusão.
  const data = await tget<{ results: TmdbItem[] }>("/discover/tv", {
    page, with_genres: 16, without_original_language: "ja",
    sort_by: "popularity.desc", "vote_count.gte": 100, "first_air_date.lte": TODAY,
  });
  const filtered = data.results.filter((r) => r.original_language !== "ja");
  return mapList(filtered, "tv", { minVotes: 100 });
}
// Lista negra de TMDB IDs de animes com conteúdo sexual explícito.
// Mesmo que o TMDB retorne, são removidos antes de exibir.
export const ANIME_BLACKLIST_IDS = new Set<number>([
  90474,  // Overflow
  37854,  // Yosuga no Sora
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
]);

// Lista negra por título (regex case-insensitive). Aplica-se a animes e
// pesquisa para garantir que conteúdos sinalizados como inadequados
// nunca apareçam, mesmo que o TMDB não os marque como adultos.
// Bloqueia hentai/ecchi pesado por título.
// Removidos da blacklist (mantidos no catálogo): sankarea, dragonaut, iwa kakeru, sport climbing girls.
export const ANIME_TITLE_BLACKLIST = /\b(takamine[- ]?san|please\s*put\s*them\s*on|girls?\s*bravo|harem\s*in\s*the\s*labyrinth|aika(\s*zero)?)\b/i;

// Animes garantidos no catálogo (whitelist por TMDB ID).
export const ANIME_WHITELIST_IDS = [
  45782, // Shokugeki no Soma / Food Wars
];

function isBlacklistedAnime(item: TmdbItem): boolean {
  if (ANIME_BLACKLIST_IDS.has(item.id)) return true;
  const title = `${item.title ?? ""} ${item.name ?? ""}`;
  return ANIME_TITLE_BLACKLIST.test(title);
}

export async function fetchAnime(page = 1): Promise<Media[]> {
  // Animes premium: apenas alta qualidade, sem romance explícito, sem hentai.
  const data = await tget<{ results: TmdbItem[] }>("/discover/tv", {
    page,
    with_genres: 16,
    with_original_language: "ja",
    include_adult: false,
    "vote_count.gte": 100,
    "vote_average.gte": 7.0,
    without_genres: 10749, // exclui romance
    sort_by: "popularity.desc",
  });
  const filtered = data.results.filter(
    (r) =>
      r.original_language === "ja" &&
      !r.adult &&
      !isBlacklistedAnime(r)
  );
  return mapList(filtered, "tv", {
    minVotes: 100,
    requireReleased: false,
    allowJa: true,
    allowHentai: false,
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
  // Alterna idioma por página para diversificar.
  const langs = ["pt", "es", "en", "ko"];
  const lang = langs[(page - 1) % langs.length];
  const innerPage = Math.floor((page - 1) / langs.length) + 1;
  const data = await tget<{ results: TmdbItem[] }>("/discover/tv", {
    page: innerPage, with_genres: 10766, with_original_language: lang,
    sort_by: "popularity.desc", "vote_count.gte": 50,
    "first_air_date.gte": "2000-01-01", "first_air_date.lte": TODAY,
  });
  return mapList(data.results, "tv", { minVotes: 50 });
}
export async function fetchNovelasTurkish(page = 1): Promise<Media[]> {
  const data = await tget<{ results: TmdbItem[] }>("/discover/tv", {
    page, with_original_language: "tr", with_genres: 18,
    sort_by: "popularity.desc", "vote_count.gte": 20,
    "first_air_date.lte": TODAY,
  });
  // Turco não está em ALLOWED_AUDIO_LANGS — bypass via mapList allowJa não cabe;
  // usamos mapItem direto com filtros mínimos.
  const genres = await loadGenres();
  return data.results
    .filter((i) => qualityFilter(i, 20))
    .filter((i) => isReleased(i))
    .map((i) => mapItem(i, "tv", genres));
}
export async function fetchNovelas(page = 1): Promise<Media[]> {
  // Combina os dois blocos alternando.
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
    page, sort_by: "primary_release_date.asc", "primary_release_date.gte": TODAY, region: REGION,
    "vote_count.gte": 0,
  });
  return mapList(data.results, "movie", { minVotes: 0, requireReleased: false });
}
export async function fetchUpcomingTv(page = 1): Promise<Media[]> {
  const data = await tget<{ results: TmdbItem[] }>("/discover/tv", {
    page, sort_by: "first_air_date.asc", "first_air_date.gte": TODAY,
  });
  return mapList(data.results, "tv", { minVotes: 0, requireReleased: false });
}
export async function fetchUpcomingAnime(page = 1): Promise<Media[]> {
  const data = await tget<{ results: TmdbItem[] }>("/discover/tv", {
    page, with_genres: 16, with_original_language: "ja",
    sort_by: "first_air_date.asc", "first_air_date.gte": TODAY,
  });
  const filtered = data.results.filter(
    (r) => r.original_language === "ja" && !isBlacklistedAnime(r)
  );
  return mapList(filtered, "tv", { minVotes: 0, requireReleased: false, allowJa: true });
}
export async function fetchUpcomingAnimation(page = 1): Promise<Media[]> {
  const data = await tget<{ results: TmdbItem[] }>("/discover/tv", {
    page, with_genres: 16, without_original_language: "ja",
    sort_by: "first_air_date.asc", "first_air_date.gte": TODAY,
  });
  const filtered = data.results.filter((r) => r.original_language !== "ja");
  return mapList(filtered, "tv", { minVotes: 0, requireReleased: false });
}

// Loader auxiliar para pesquisa multi-página agregando popular + top_rated
function combineLoaders(...loaders: Array<(p: number) => Promise<Media[]>>): (page: number) => Promise<Media[]> {
  return async (page: number) => {
    const idx = (page - 1) % loaders.length;
    const inner = Math.floor((page - 1) / loaders.length) + 1;
    return loaders[idx](inner);
  };
}

export const fetchAllMovies = combineLoaders(fetchPopularMovies, fetchTopRatedMovies, fetchNowPlaying);
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
  // 6 destaques pra rotação do hero. Oversample 3 páginas e deduplica
  // para garantir pelo menos 6 itens válidos mesmo após filtros.
  const [p1, p2, p3] = await Promise.all([
    fetchTrending(1).catch(() => []),
    fetchTrending(2).catch(() => []),
    fetchPopularMovies(1).catch(() => []),
  ]);
  const seen = new Set<number>();
  const merged: Media[] = [];
  for (const m of [...p1, ...p2, ...p3]) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    if (!m.backdropUrl) continue;
    merged.push(m);
    if (merged.length >= 6) break;
  }
  return merged.slice(0, 6);
}

// ============ Contadores totais por categoria ============
async function totalFor(path: string, params: Record<string, string | number> = {}): Promise<number> {
  try {
    const data = await tget<{ total_results: number }>(path, { ...params, page: 1 });
    return data.total_results ?? 0;
  } catch { return 0; }
}
export async function countMovies(): Promise<number> {
  return totalFor("/discover/movie", { sort_by: "popularity.desc", "vote_count.gte": 100 });
}
export async function countSeries(): Promise<number> {
  return totalFor("/discover/tv", { sort_by: "popularity.desc", "vote_count.gte": 100, without_genres: 10764 });
}
export async function countAnime(): Promise<number> {
  return totalFor("/discover/tv", {
    with_genres: 16,
    with_original_language: "ja",
    "vote_count.gte": 100,
    "vote_average.gte": 7.0,
    without_genres: 10749,
  });
}
export async function countAnimation(): Promise<number> {
  return totalFor("/discover/tv", { with_genres: 16, without_original_language: "ja" });
}
export async function countNovelas(): Promise<number> {
  const [a, b] = await Promise.all([
    totalFor("/discover/tv", { with_genres: 10766 }),
    totalFor("/discover/tv", { with_original_language: "tr", with_genres: 18 }),
  ]);
  return a + b;
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

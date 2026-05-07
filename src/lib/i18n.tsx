import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { settingsMessages } from "@/lib/settingsMessages";

export type AppLanguage = "pt-BR" | "en-US" | "es-ES";

export const LANGUAGE_OPTIONS: Array<{ value: AppLanguage; label: string }> = [
  { value: "pt-BR", label: "Português" },
  { value: "en-US", label: "English" },
  { value: "es-ES", label: "Español" },
];

type Dict = Record<string, string>;

const STORAGE_KEY = "streamflix:language";

const messages: Record<AppLanguage, Dict> = {
  "pt-BR": {
    "nav.home": "Início",
    "nav.series": "Séries",
    "nav.movies": "Filmes",
    "nav.trending": "Em Alta",
    "nav.myList": "Minha Lista",
    "nav.search": "Buscar",
    "nav.searchPlaceholder": "Buscar...",
    "nav.profileMenu": "Menu do perfil",
    "nav.settings": "Configurações",
    "nav.logout": "Sair",
    "nav.login": "Entrar",
    "auth.who": "Quem está aí?",
    "auth.whoSubtitle": "Toque na sua conta para entrar",
    "auth.welcome": "Bem-vindo de volta",
    "auth.welcomeSubtitle": "Entre com seu email e senha",
    "auth.createAccount": "Criar sua conta",
    "auth.createSubtitle": "Etapa 1 de 2 — depois personalizamos sua experiência",
    "auth.usePassword": "Confirme sua senha",
    "auth.usePasswordDesc": "Precisamos validar esta conta uma vez neste dispositivo.",
    "auth.sessionRenew": "Sessão precisa ser renovada",
    "auth.sessionExpired": "Sessão expirada",
    "auth.passwordContinue": "Digite sua senha para continuar.",
    "auth.password": "Senha",
    "auth.passwordPlaceholder": "Sua senha",
    "auth.cancel": "Cancelar",
    "auth.removeDevice": "Remover deste dispositivo",
    "auth.enter": "Entrar",
    "auth.otherAccount": "Entrar com outra conta",
    "auth.name": "Nome",
    "auth.email": "Email",
    "auth.remember": "Salvar minhas informações neste dispositivo",
    "auth.loading": "Carregando...",
    "auth.continue": "Continuar",
    "auth.backAccounts": "← Voltar para contas salvas",
    "auth.or": "ou",
    "auth.explorer": "Entrar como Explorador",
    "auth.explorerDesc": "3 episódios por série, 20 min por filme.",
    "auth.newHere": "Novo no StreamFlix?",
    "auth.signup": "Cadastre-se",
    "auth.haveAccount": "Já tem conta?",
    "settings.title": "Configurações",
    "settings.subtitle": "Ajuste sua conta, personalize a aparência e controle como o catálogo responde ao seu uso.",
    "settings.accountActive": "Conta ativa",
    "settings.livePreview": "Pré-visualização em tempo real de avatar, cor, nome e acesso",
    "settings.currentVisual": "Visual atual",
    "settings.ready": "Conta pronta para personalização",
    "settings.access": "Meu acesso",
    "settings.accessDesc": "Edite o visual, nome e nível de acesso da conta atual.",
    "settings.editVisual": "Editar avatar, nome, cor e maturidade",
    "settings.deviceAccounts": "Contas neste dispositivo",
    "settings.deviceAccountsDesc": "As contas salvas ficam aqui com acesso rápido e visual personalizado.",
    "settings.current": "Atual",
    "settings.editSaved": "Editar visual",
    "settings.removeSaved": "Remover do dispositivo",
    "settings.appPrefs": "Preferências do app",
    "settings.appPrefsDesc": "Estas configurações mudam ordem, destaque e filtros reais do catálogo.",
    "settings.save": "Salvar ajustes",
    "settings.saving": "Salvando...",
    "settings.updated": "Configurações atualizadas",
    "settings.profileUpdated": "Conta personalizada",
    "settings.language": "Idioma da interface",
    "settings.languageDesc": "Troca toda a navegação e as telas principais do app.",
    "settings.logout": "Sair da conta atual",
    "settings.preview": "Pré-visualização",
    "settings.accountName": "Nome da conta",
    "settings.avatar": "Avatar",
    "settings.uploadPhoto": "Enviar nova foto",
    "settings.uploading": "Enviando foto...",
    "settings.cardColor": "Cor da conta",
    "settings.accessLevel": "Nível de acesso",
    "settings.allow16": "Permitir conteúdo +16",
    "settings.guardian": "Definido pelo responsável",
    "settings.close": "Fechar",
    "settings.saveButton": "Salvar",
    "home.explorer": "Você está no Modo Explorador",
    "home.explorerDesc": "Catálogo limitado e player bloqueado. Crie uma conta para liberar tudo.",
    "home.hero": "Destaque",
    "browse.available": "títulos disponíveis",
    "browse.explore": "Explorar",
    "search.results": "Resultados para \"{q}\"",
    "search.empty": "Nenhum resultado encontrado.",
    "myList.title": "Minha Lista",
    "myList.savedOne": "título salvo",
    "myList.savedMany": "títulos salvos",
    "myList.empty": "Sua lista está vazia. Adicione filmes e séries para assistir depois.",
    "player.playing": "Reproduzindo",
    "player.close": "Voltar",
    "player.locked": "Player bloqueado",
    "player.lockedDesc": "No Modo Explorador você só assiste a uma seleção limitada. Crie uma conta gratuita para liberar tudo.",
    "player.create": "Criar conta",
    "player.movieLimit": "Limite de 20 minutos atingido",
    "player.seriesLimit": "Limite de 3 episódios atingido",
    "player.limitDesc": "Crie sua conta gratuita para continuar assistindo sem interrupções.",
    "player.createNow": "Criar conta agora",
    "player.waiting": "Player aguardando configuração",
    "player.waitingDesc": "O servidor de vídeo ainda não foi conectado. Defina VITE_VIDEO_SERVER_BASE para começar a reproduzir.",
    "footer.copy": "Streaming premium em qualidade cinematográfica. Filmes, séries e exclusivos.",
    "footer.browse": "Navegar",
    "footer.account": "Conta",
    "footer.connect": "Conecte-se",
    "footer.rights": "Todos os direitos reservados.",
    "common.loading": "Carregando...",
    "common.back": "Voltar",
    "common.finish": "Concluir",
    "common.next": "Continuar",
    "notFound.title": "Página não encontrada",
    "notFound.backHome": "Voltar para o início"
  },
  "en-US": {
    "nav.home": "Home","nav.series": "Series","nav.movies": "Movies","nav.trending": "Trending","nav.myList": "My List","nav.search": "Search","nav.searchPlaceholder": "Search...","nav.profileMenu": "Profile menu","nav.settings": "Settings","nav.logout": "Sign out","nav.login": "Sign in",
    "auth.who": "Who's watching?","auth.whoSubtitle": "Tap your account to enter","auth.welcome": "Welcome back","auth.welcomeSubtitle": "Sign in with your email and password","auth.createAccount": "Create your account","auth.createSubtitle": "Step 1 of 2 — then we tailor your experience","auth.usePassword": "Confirm your password","auth.usePasswordDesc": "We need to verify this account once on this device.","auth.sessionRenew": "Session needs renewal","auth.sessionExpired": "Session expired","auth.passwordContinue": "Enter your password to continue.","auth.password": "Password","auth.passwordPlaceholder": "Your password","auth.cancel": "Cancel","auth.removeDevice": "Remove from device","auth.enter": "Enter","auth.otherAccount": "Use another account","auth.name": "Name","auth.email": "Email","auth.remember": "Save my information on this device","auth.loading": "Loading...","auth.continue": "Continue","auth.backAccounts": "← Back to saved accounts","auth.or": "or","auth.explorer": "Continue as Explorer","auth.explorerDesc": "3 episodes per series, 20 min per movie.","auth.newHere": "New to StreamFlix?","auth.signup": "Sign up","auth.haveAccount": "Already have an account?",
    "settings.title": "Settings","settings.subtitle": "Adjust your account, personalize the look, and control how the catalog responds to your usage.","settings.accountActive": "Active account","settings.livePreview": "Real-time preview of avatar, color, name and access","settings.currentVisual": "Current look","settings.ready": "Account ready for personalization","settings.access": "My access","settings.accessDesc": "Edit the current account's look, name and access level.","settings.editVisual": "Edit avatar, name, color and maturity","settings.deviceAccounts": "Accounts on this device","settings.deviceAccountsDesc": "Saved accounts live here with quick access and custom visuals.","settings.current": "Current","settings.editSaved": "Edit look","settings.removeSaved": "Remove from device","settings.appPrefs": "App preferences","settings.appPrefsDesc": "These settings change ranking, highlights and real catalog filters.","settings.save": "Save settings","settings.saving": "Saving...","settings.updated": "Settings updated","settings.profileUpdated": "Account updated","settings.language": "Interface language","settings.languageDesc": "Switches navigation and the main app screens.","settings.logout": "Sign out of current account","settings.preview": "Preview","settings.accountName": "Account name","settings.avatar": "Avatar","settings.uploadPhoto": "Upload new photo","settings.uploading": "Uploading photo...","settings.cardColor": "Account color","settings.accessLevel": "Access level","settings.allow16": "Allow 16+ content","settings.guardian": "Controlled by the guardian","settings.close": "Close","settings.saveButton": "Save",
    "home.explorer": "You are in Explorer Mode","home.explorerDesc": "Limited catalog and locked player. Create an account to unlock everything.","home.hero": "Featured","browse.available": "titles available","browse.explore": "Browse","search.results": "Results for \"{q}\"","search.empty": "No results found.","myList.title": "My List","myList.savedOne": "saved title","myList.savedMany": "saved titles","myList.empty": "Your list is empty. Add movies and series to watch later.","player.playing": "Now playing","player.close": "Back","player.locked": "Player locked","player.lockedDesc": "In Explorer Mode you can only watch a limited selection. Create a free account to unlock everything.","player.create": "Create account","player.movieLimit": "20-minute limit reached","player.seriesLimit": "3-episode limit reached","player.limitDesc": "Create your free account to keep watching without interruptions.","player.createNow": "Create account now","player.waiting": "Player waiting for setup","player.waitingDesc": "The video server is not connected yet. Set VITE_VIDEO_SERVER_BASE to start playback.","footer.copy": "Premium streaming with cinematic quality. Movies, series and exclusives.","footer.browse": "Browse","footer.account": "Account","footer.connect": "Connect","footer.rights": "All rights reserved.","common.loading": "Loading...","common.back": "Back","common.finish": "Finish","common.next": "Continue","notFound.title": "Page not found","notFound.backHome": "Back to home"
  },
  "es-ES": {
    "nav.home": "Inicio","nav.series": "Series","nav.movies": "Películas","nav.trending": "Tendencias","nav.myList": "Mi lista","nav.search": "Buscar","nav.searchPlaceholder": "Buscar...","nav.profileMenu": "Menú del perfil","nav.settings": "Configuración","nav.logout": "Salir","nav.login": "Entrar",
    "auth.who": "¿Quién está viendo?","auth.whoSubtitle": "Toca tu cuenta para entrar","auth.welcome": "Bienvenido de nuevo","auth.welcomeSubtitle": "Entra con tu correo y contraseña","auth.createAccount": "Crear tu cuenta","auth.createSubtitle": "Paso 1 de 2 — luego personalizamos tu experiencia","auth.usePassword": "Confirma tu contraseña","auth.usePasswordDesc": "Necesitamos validar esta cuenta una vez en este dispositivo.","auth.sessionRenew": "La sesión debe renovarse","auth.sessionExpired": "Sesión expirada","auth.passwordContinue": "Escribe tu contraseña para continuar.","auth.password": "Contraseña","auth.passwordPlaceholder": "Tu contraseña","auth.cancel": "Cancelar","auth.removeDevice": "Quitar del dispositivo","auth.enter": "Entrar","auth.otherAccount": "Entrar con otra cuenta","auth.name": "Nombre","auth.email": "Correo","auth.remember": "Guardar mi información en este dispositivo","auth.loading": "Cargando...","auth.continue": "Continuar","auth.backAccounts": "← Volver a cuentas guardadas","auth.or": "o","auth.explorer": "Entrar como Explorador","auth.explorerDesc": "3 episodios por serie, 20 min por película.","auth.newHere": "¿Nuevo en StreamFlix?","auth.signup": "Regístrate","auth.haveAccount": "¿Ya tienes cuenta?",
    "settings.title": "Configuración","settings.subtitle": "Ajusta tu cuenta, personaliza la apariencia y controla cómo responde el catálogo a tu uso.","settings.accountActive": "Cuenta activa","settings.livePreview": "Vista previa en tiempo real de avatar, color, nombre y acceso","settings.currentVisual": "Visual actual","settings.ready": "Cuenta lista para personalizar","settings.access": "Mi acceso","settings.accessDesc": "Edita el visual, nombre y nivel de acceso de la cuenta actual.","settings.editVisual": "Editar avatar, nombre, color y madurez","settings.deviceAccounts": "Cuentas en este dispositivo","settings.deviceAccountsDesc": "Las cuentas guardadas viven aquí con acceso rápido y visual personalizado.","settings.current": "Actual","settings.editSaved": "Editar visual","settings.removeSaved": "Quitar del dispositivo","settings.appPrefs": "Preferencias de la app","settings.appPrefsDesc": "Estos ajustes cambian el orden, los destacados y los filtros reales del catálogo.","settings.save": "Guardar ajustes","settings.saving": "Guardando...","settings.updated": "Configuración actualizada","settings.profileUpdated": "Cuenta actualizada","settings.language": "Idioma de la interfaz","settings.languageDesc": "Cambia la navegación y las pantallas principales de la app.","settings.logout": "Salir de la cuenta actual","settings.preview": "Vista previa","settings.accountName": "Nombre de la cuenta","settings.avatar": "Avatar","settings.uploadPhoto": "Subir nueva foto","settings.uploading": "Subiendo foto...","settings.cardColor": "Color de la cuenta","settings.accessLevel": "Nivel de acceso","settings.allow16": "Permitir contenido +16","settings.guardian": "Definido por el responsable","settings.close": "Cerrar","settings.saveButton": "Guardar",
    "home.explorer": "Estás en modo Explorador","home.explorerDesc": "Catálogo limitado y reproductor bloqueado. Crea una cuenta para desbloquear todo.","home.hero": "Destacado","browse.available": "títulos disponibles","browse.explore": "Explorar","search.results": "Resultados para \"{q}\"","search.empty": "No se encontraron resultados.","myList.title": "Mi lista","myList.savedOne": "título guardado","myList.savedMany": "títulos guardados","myList.empty": "Tu lista está vacía. Agrega películas y series para ver después.","player.playing": "Reproduciendo","player.close": "Volver","player.locked": "Reproductor bloqueado","player.lockedDesc": "En modo Explorador solo puedes ver una selección limitada. Crea una cuenta gratis para desbloquear todo.","player.create": "Crear cuenta","player.movieLimit": "Se alcanzó el límite de 20 minutos","player.seriesLimit": "Se alcanzó el límite de 3 episodios","player.limitDesc": "Crea tu cuenta gratis para seguir viendo sin interrupciones.","player.createNow": "Crear cuenta ahora","player.waiting": "Reproductor pendiente de configuración","player.waitingDesc": "El servidor de video aún no está conectado. Define VITE_VIDEO_SERVER_BASE para empezar a reproducir.","footer.copy": "Streaming premium con calidad cinematográfica. Películas, series y exclusivos.","footer.browse": "Explorar","footer.account": "Cuenta","footer.connect": "Conéctate","footer.rights": "Todos los derechos reservados.","common.loading": "Cargando...","common.back": "Volver","common.finish": "Finalizar","common.next": "Continuar","notFound.title": "Página no encontrada","notFound.backHome": "Volver al inicio"
  },
};

type I18nContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => (localStorage.getItem(STORAGE_KEY) as AppLanguage) || "pt-BR");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage: setLanguageState,
    t: (key, vars) => {
      const template =
        messages[language][key] ??
        settingsMessages[language][key] ??
        messages["pt-BR"][key] ??
        settingsMessages["pt-BR"][key] ??
        key;
      return Object.entries(vars ?? {}).reduce((acc, [name, value]) => acc.split(`{${name}}`).join(String(value)), template);
    },
  }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
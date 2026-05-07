// Hook para ler/atualizar user_settings no backend.
// Cria registro automaticamente via trigger de DB; aqui só lê/atualiza.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n, type AppLanguage } from "@/lib/i18n";

export type UserSettings = {
  user_id: string;
  language: AppLanguage;
  subtitles_enabled: boolean;
  subtitles_language: AppLanguage;
  data_saver: boolean;
  notifications_new_releases: boolean;
  notifications_continue_watching: boolean;
  recommendations_enabled: boolean;
  watch_history_enabled: boolean;
  autoplay_next: boolean;
  resume_playback: boolean;
  skip_intro_auto: boolean;
  skip_intro_seconds: number;
  performance_mode: boolean;
  discovery_mode: boolean;
};

const DEFAULTS: Omit<UserSettings, "user_id"> = {
  language: "pt-BR",
  subtitles_enabled: true,
  subtitles_language: "pt-BR",
  data_saver: false,
  notifications_new_releases: true,
  notifications_continue_watching: true,
  recommendations_enabled: true,
  watch_history_enabled: true,
  autoplay_next: true,
  resume_playback: true,
  skip_intro_auto: false,
  skip_intro_seconds: 90,
  performance_mode: false,
  discovery_mode: false,
};

export function useUserSettings() {
  const { user } = useAuth();
  const { setLanguage } = useI18n();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("user_settings" as never)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      setSettings(data as unknown as UserSettings);
      // Sincroniza idioma da interface com o salvo
      setLanguage((data as unknown as UserSettings).language);
    } else {
      // fallback: se trigger ainda não rodou
      const fresh: UserSettings = { user_id: user.id, ...DEFAULTS };
      await supabase.from("user_settings" as never).insert(fresh as never);
      setSettings(fresh);
    }
    setLoading(false);
  }, [user, setLanguage]);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(
    async (patch: Partial<Omit<UserSettings, "user_id">>) => {
      if (!user || !settings) return;
      const next = { ...settings, ...patch };
      setSettings(next);
      if (patch.language) setLanguage(patch.language);
      await supabase
        .from("user_settings" as never)
        .update(patch as never)
        .eq("user_id", user.id);
    },
    [user, settings, setLanguage]
  );

  return { settings, loading, update, reload: load };
}

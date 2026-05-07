// Registra e lista dispositivos/sessões ativas desta conta.
// Fingerprint simples baseado em user agent + um id local persistente.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const FINGERPRINT_KEY = "streamflix:device-fingerprint";

export type DeviceRow = {
  id: string;
  user_id: string;
  device_fingerprint: string;
  device_name: string | null;
  user_agent: string | null;
  platform: string | null;
  last_seen_at: string;
  created_at: string;
};

function getLocalFingerprint(): string {
  let fp = localStorage.getItem(FINGERPRINT_KEY);
  if (!fp) {
    fp = crypto.randomUUID();
    localStorage.setItem(FINGERPRINT_KEY, fp);
  }
  return fp;
}

function detectPlatform(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Mac/i.test(ua)) return "macOS";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Linux/i.test(ua)) return "Linux";
  return "Web";
}

function detectDeviceName(): string {
  const platform = detectPlatform();
  const ua = navigator.userAgent;
  const browser = /Chrome/i.test(ua) ? "Chrome" : /Firefox/i.test(ua) ? "Firefox" : /Safari/i.test(ua) ? "Safari" : "Browser";
  return `${platform} · ${browser}`;
}

export function useDevices() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const currentFp = getLocalFingerprint();

  const load = useCallback(async () => {
    if (!user) {
      setDevices([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("user_devices" as never)
      .select("*")
      .eq("user_id", user.id)
      .order("last_seen_at", { ascending: false });
    setDevices((data ?? []) as unknown as DeviceRow[]);
    setLoading(false);
  }, [user]);

  // Registra / atualiza dispositivo atual
  useEffect(() => {
    if (!user) return;
    const upsert = async () => {
      await supabase.from("user_devices" as never).upsert(
        {
          user_id: user.id,
          device_fingerprint: currentFp,
          device_name: detectDeviceName(),
          user_agent: navigator.userAgent.slice(0, 500),
          platform: detectPlatform(),
          last_seen_at: new Date().toISOString(),
        } as never,
        { onConflict: "user_id,device_fingerprint" } as never
      );
      load();
    };
    upsert();
  }, [user, currentFp, load]);

  const removeDevice = useCallback(
    async (id: string) => {
      await supabase.from("user_devices" as never).delete().eq("id", id);
      load();
    },
    [load]
  );

  return { devices, loading, currentFingerprint: currentFp, reload: load, removeDevice };
}

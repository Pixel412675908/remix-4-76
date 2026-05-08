// 16 avatares ilustrados originais — estilos diversos (urbano, sci-fi, fantasia, kids, ação)
import a1 from "@/assets/avatars/avatar-1.png";
import a2 from "@/assets/avatars/avatar-2.png";
import a3 from "@/assets/avatars/avatar-3.png";
import a4 from "@/assets/avatars/avatar-4.png";
import a5 from "@/assets/avatars/avatar-5.png";
import a6 from "@/assets/avatars/avatar-6.png";
import a7 from "@/assets/avatars/avatar-7.png";
import a8 from "@/assets/avatars/avatar-8.png";
import a9 from "@/assets/avatars/avatar-9.png";
import a10 from "@/assets/avatars/avatar-10.png";
import a11 from "@/assets/avatars/avatar-11.png";
import a12 from "@/assets/avatars/avatar-12.png";
import a13 from "@/assets/avatars/avatar-13.png";
import a14 from "@/assets/avatars/avatar-14.png";
import a15 from "@/assets/avatars/avatar-15.png";
import a16 from "@/assets/avatars/avatar-16.png";
import a17 from "@/assets/avatars/avatar-17.png";
import a18 from "@/assets/avatars/avatar-18.png";
import a19 from "@/assets/avatars/avatar-19.png";
import a20 from "@/assets/avatars/avatar-20.png";
import s1 from "@/assets/avatars-svg/avatar-1.svg";
import s2 from "@/assets/avatars-svg/avatar-2.svg";
import s3 from "@/assets/avatars-svg/avatar-3.svg";
import s4 from "@/assets/avatars-svg/avatar-4.svg";
import s5 from "@/assets/avatars-svg/avatar-5.svg";
import s6 from "@/assets/avatars-svg/avatar-6.svg";
import s7 from "@/assets/avatars-svg/avatar-7.svg";
import s8 from "@/assets/avatars-svg/avatar-8.svg";
import s9 from "@/assets/avatars-svg/avatar-9.svg";
import s10 from "@/assets/avatars-svg/avatar-10.svg";
import s11 from "@/assets/avatars-svg/avatar-11.svg";
import s12 from "@/assets/avatars-svg/avatar-12.svg";
import s13 from "@/assets/avatars-svg/avatar-13.svg";
import s14 from "@/assets/avatars-svg/avatar-14.svg";
import s15 from "@/assets/avatars-svg/avatar-15.svg";
import s16 from "@/assets/avatars-svg/avatar-16.svg";

export interface PresetAvatar {
  id: string;
  url: string;
  label: string;
  kid?: boolean;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  { id: "preset-1", url: a1, label: "Maya" },
  { id: "preset-2", url: a2, label: "Solar" },
  { id: "preset-3", url: a3, label: "Yumi" },
  { id: "preset-4", url: a4, label: "Sole" },
  { id: "preset-5", url: a5, label: "Mestre" },
  { id: "preset-6", url: a6, label: "Órbita" },
  { id: "preset-7", url: a7, label: "Bambu", kid: true },
  { id: "preset-8", url: a8, label: "Coruja", kid: true },
  { id: "preset-9", url: a9, label: "Sombra" },
  { id: "preset-10", url: a10, label: "Aviador" },
  { id: "preset-11", url: a11, label: "Nova" },
  { id: "preset-12", url: a12, label: "Neon" },
  { id: "preset-13", url: a13, label: "Estelar", kid: true },
  { id: "preset-14", url: a14, label: "Chef" },
  { id: "preset-15", url: a15, label: "Flow" },
  { id: "preset-16", url: a16, label: "Drako", kid: true },
  { id: "preset-17", url: a17, label: "Maple" },
  { id: "preset-18", url: a18, label: "Atlas" },
  { id: "preset-19", url: a19, label: "Iris" },
  { id: "preset-20", url: a20, label: "Kiro" },
  { id: "svg-1", url: s1, label: "Maya V" },
  { id: "svg-2", url: s2, label: "Solar V" },
  { id: "svg-3", url: s3, label: "Yumi V" },
  { id: "svg-4", url: s4, label: "Sole V", kid: true },
  { id: "svg-5", url: s5, label: "Mestre V" },
  { id: "svg-6", url: s6, label: "Órbita V" },
  { id: "svg-7", url: s7, label: "Bambu V", kid: true },
  { id: "svg-8", url: s8, label: "Coruja V", kid: true },
  { id: "svg-9", url: s9, label: "Sombra V" },
  { id: "svg-10", url: s10, label: "Aviador V" },
  { id: "svg-11", url: s11, label: "Nova V" },
  { id: "svg-12", url: s12, label: "Neon V" },
  { id: "svg-13", url: s13, label: "Estelar V", kid: true },
  { id: "svg-14", url: s14, label: "Chef V" },
  { id: "svg-15", url: s15, label: "Flow V" },
  { id: "svg-16", url: s16, label: "Drako V", kid: true },
];

export function avatarFromName(_name: string): string | null {
  return null;
}

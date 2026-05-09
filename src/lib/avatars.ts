// Avatares ilustrados — 20 originais + 10 imagens externas (5 masculinos / 5 femininos)
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
  // Masculinos (links externos)
  { id: "ext-m1", url: "https://i.postimg.cc/bNFs06Jv/280c7df0706c689019cd9e670024313e.jpg", label: "Ryu" },
  { id: "ext-m2", url: "https://i.postimg.cc/9XLMVxyF/images-1.jpg", label: "Kai" },
  { id: "ext-m3", url: "https://i.postimg.cc/5t54rpxX/images-2.jpg", label: "Hiro" },
  { id: "ext-m4", url: "https://i.postimg.cc/yxx7kH0f/551fff636303fb8a696c213736ddc09e.jpg", label: "Akira" },
  { id: "ext-m5", url: "https://i.postimg.cc/Fsf9vhrh/edb3a517287696659bcf631644d5f682.jpg", label: "Ren" },
  // Femininos (links externos)
  { id: "ext-f1", url: "https://i.postimg.cc/85PS0SXD/images-3.jpg", label: "Aiko" },
  { id: "ext-f2", url: "https://i.postimg.cc/nrXtn1t9/f009d085cffee46f0152e62975980d93.jpg", label: "Hana" },
  { id: "ext-f3", url: "https://i.postimg.cc/QdGrr5Y4/images-4.jpg", label: "Sora" },
  { id: "ext-f4", url: "https://i.postimg.cc/kgQPM4kq/anime-girl-forest-with-flowers-839169-38220.jpg", label: "Yuki", kid: true },
  { id: "ext-f5", url: "https://i.postimg.cc/q7QfnFJ6/a0f18bbc2e83b20b37219e5f88dd1737.jpg", label: "Mei" },
];

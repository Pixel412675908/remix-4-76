// Avatares — somente links externos fornecidos pelo usuário (5 masculinos + 5 femininos)

export interface PresetAvatar {
  id: string;
  url: string;
  label: string;
  kid?: boolean;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  // Masculinos
  { id: "ext-m1", url: "https://i.postimg.cc/bNFs06Jv/280c7df0706c689019cd9e670024313e.jpg", label: "Ryu" },
  { id: "ext-m2", url: "https://i.postimg.cc/9XLMVxyF/images-1.jpg", label: "Kai" },
  { id: "ext-m3", url: "https://i.postimg.cc/5t54rpxX/images-2.jpg", label: "Hiro" },
  { id: "ext-m4", url: "https://i.postimg.cc/yxx7kH0f/551fff636303fb8a696c213736ddc09e.jpg", label: "Akira" },
  { id: "ext-m5", url: "https://i.postimg.cc/Fsf9vhrh/edb3a517287696659bcf631644d5f682.jpg", label: "Ren" },
  // Femininos
  { id: "ext-f1", url: "https://i.postimg.cc/85PS0SXD/images-3.jpg", label: "Aiko" },
  { id: "ext-f2", url: "https://i.postimg.cc/nrXtn1t9/f009d085cffee46f0152e62975980d93.jpg", label: "Hana" },
  { id: "ext-f3", url: "https://i.postimg.cc/QdGrr5Y4/images-4.jpg", label: "Sora" },
  { id: "ext-f4", url: "https://i.postimg.cc/kgQPM4kq/anime-girl-forest-with-flowers-839169-38220.jpg", label: "Yuki", kid: true },
  { id: "ext-f5", url: "https://i.postimg.cc/q7QfnFJ6/a0f18bbc2e83b20b37219e5f88dd1737.jpg", label: "Mei" },
];

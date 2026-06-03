// Hash determinístico para senha de conteúdo adulto.
// Não recuperável: usa userId como salt, SHA-256 hex.

export async function hashAdultPassword(userId: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${userId}:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyAdultPassword(
  userId: string,
  password: string,
  storedHash: string
): Promise<boolean> {
  if (!storedHash) return false;
  const h = await hashAdultPassword(userId, password);
  return h === storedHash;
}

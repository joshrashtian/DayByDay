/** PKCE helpers — see RFC 7636. Uses WebCrypto, no dependencies. */

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/** 43–128 chars of unreserved characters; 96 random bytes lands in range. */
export function createCodeVerifier(): string {
  return base64Url(randomBytes(96)).slice(0, 128);
}

export async function deriveCodeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return base64Url(new Uint8Array(digest));
}

/** Opaque value echoed back by Spotify; guards against a stray callback. */
export function createState(): string {
  return base64Url(randomBytes(16));
}

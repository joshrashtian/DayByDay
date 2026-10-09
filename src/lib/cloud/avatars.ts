import { supabase } from "@/utils/supabase";

/** Storage bucket that holds uploaded avatars (Supabase starter convention). */
export const AVATAR_BUCKET = "avatars";

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export const AVATAR_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

/**
 * `profiles.avatar_url` is either a full URL (e.g. from an OAuth provider) or
 * a path inside the avatars bucket; resolve the latter to its public URL.
 */
export function resolveAvatarUrl(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;
  return supabase.storage.from(AVATAR_BUCKET).getPublicUrl(trimmed).data
    .publicUrl;
}

/**
 * Uploads `file` to `avatars/<userId>/<timestamp>.<ext>` and points
 * `profiles.avatar_url` at it. Each upload gets a fresh path, so no update
 * policy on storage is needed and cached copies of the old image never linger.
 * Returns the resolved public URL.
 */
export async function uploadAvatar(
  userId: string,
  file: File,
): Promise<{ url: string | null; error: string | null }> {
  if (!AVATAR_ACCEPT.split(",").includes(file.type)) {
    return { url: null, error: "Choose a PNG, JPEG, WebP or GIF image." };
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return { url: null, error: "Images must be 5 MB or smaller." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { contentType: file.type });
  if (uploadError) return { url: null, error: uploadError.message };

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: path })
    .eq("id", userId);
  if (updateError) return { url: null, error: updateError.message };

  return { url: resolveAvatarUrl(path), error: null };
}

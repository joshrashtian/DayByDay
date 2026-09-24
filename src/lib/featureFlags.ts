/**
 * Build-time feature flags, read from `VITE_*` env vars. They are constants,
 * so Vite drops the gated branches from builds that leave them off.
 */

/**
 * Spotify only grants extended API quota to apps with 250k+ MAU; below that an
 * app stays in development mode, limited to hand-allowlisted users. So the
 * integration is hidden unless `VITE_ENABLE_SPOTIFY=true`.
 */
export const SPOTIFY_ENABLED = import.meta.env.VITE_ENABLE_SPOTIFY === "true";

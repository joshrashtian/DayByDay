//! Loopback redirect listener for the Google Calendar OAuth (PKCE) flow.
//!
//! Google's "Desktop app" OAuth clients accept any `http://127.0.0.1:<port>`
//! redirect without registering it, so the port only has to stay clear of the
//! Spotify listener and agree with `GOOGLE_REDIRECT_PORT` on the frontend.

use std::sync::atomic::AtomicU64;

use crate::oauth_loopback::{self, OauthCallback};

/// Must match `GOOGLE_REDIRECT_PORT` in `src/lib/integrations/google/config.ts`.
pub const REDIRECT_PORT: u16 = 14566;

static LISTENER_GENERATION: AtomicU64 = AtomicU64::new(0);

#[tauri::command]
pub async fn google_oauth_listen(timeout_secs: u64) -> Result<OauthCallback, String> {
    oauth_loopback::listen("Google", REDIRECT_PORT, &LISTENER_GENERATION, timeout_secs).await
}

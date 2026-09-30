//! Loopback redirect listener for the Spotify OAuth (PKCE) flow.
//!
//! Spotify only allows non-HTTPS redirect URIs for loopback addresses, and the
//! registered URI is matched as an exact string — so the host must literally be
//! `127.0.0.1` (Spotify deprecated `localhost`) and the port is fixed here to
//! match whatever is registered in the Spotify developer dashboard.

use std::sync::atomic::AtomicU64;

use crate::oauth_loopback::{self, OauthCallback};

/// Must match the redirect URI registered in the Spotify dashboard.
pub const REDIRECT_PORT: u16 = 14565;

static LISTENER_GENERATION: AtomicU64 = AtomicU64::new(0);

#[tauri::command]
pub async fn spotify_oauth_listen(timeout_secs: u64) -> Result<OauthCallback, String> {
    oauth_loopback::listen("Spotify", REDIRECT_PORT, &LISTENER_GENERATION, timeout_secs).await
}

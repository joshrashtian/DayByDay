//! One-shot loopback HTTP listener for the Spotify OAuth (PKCE) redirect.
//!
//! Spotify only allows non-HTTPS redirect URIs for loopback addresses, and the
//! registered URI is matched as an exact string — so the host must literally be
//! `127.0.0.1` (Spotify deprecated `localhost`) and the port is fixed here to
//! match whatever is registered in the Spotify developer dashboard.

use std::io::{BufRead, BufReader, Write};
use std::net::TcpListener;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{Duration, Instant};

/// Must match the redirect URI registered in the Spotify dashboard.
pub const REDIRECT_PORT: u16 = 14565;

/// Bumped by every `spotify_oauth_listen` call. A listener whose generation
/// is no longer current drops its socket, so a retry from the frontend (after
/// an error, a hot reload, or the user simply clicking Connect again) never
/// collides with a stale listener still waiting out its timeout.
static LISTENER_GENERATION: AtomicU64 = AtomicU64::new(0);

/// How long a new listener waits for a superseded one to notice and release
/// the port. The stale loop polls every 120ms, so this is generous.
const SUPERSEDE_GRACE: Duration = Duration::from_secs(2);

#[derive(serde::Serialize)]
pub struct OauthCallback {
    pub code: Option<String>,
    pub state: Option<String>,
    pub error: Option<String>,
}

/// Decodes `application/x-www-form-urlencoded` query values.
fn percent_decode(raw: &str) -> String {
    let bytes = raw.as_bytes();
    let mut out: Vec<u8> = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        match bytes[i] {
            b'+' => {
                out.push(b' ');
                i += 1;
            }
            b'%' if i + 2 < bytes.len() => {
                let hex = std::str::from_utf8(&bytes[i + 1..i + 3]).unwrap_or("");
                match u8::from_str_radix(hex, 16) {
                    Ok(byte) => {
                        out.push(byte);
                        i += 3;
                    }
                    Err(_) => {
                        out.push(bytes[i]);
                        i += 1;
                    }
                }
            }
            byte => {
                out.push(byte);
                i += 1;
            }
        }
    }
    String::from_utf8_lossy(&out).into_owned()
}

fn callback_page(ok: bool) -> String {
    let (title, detail) = if ok {
        ("Spotify connected", "You can close this tab and return to RiseByDay.")
    } else {
        ("Connection cancelled", "RiseByDay did not receive access to your Spotify account.")
    };
    format!(
        "<!doctype html><html><head><meta charset=\"utf-8\"><title>{title}</title></head>\
         <body style=\"margin:0;display:grid;place-items:center;height:100vh;\
         font:16px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#101014;color:#f4f4f5\">\
         <div style=\"text-align:center;max-width:28rem;padding:2rem\">\
         <h1 style=\"font-size:1.5rem;margin:0 0 .5rem\">{title}</h1>\
         <p style=\"margin:0;color:#a1a1aa\">{detail}</p></div></body></html>"
    )
}

fn write_response(stream: &mut std::net::TcpStream, status: &str, body: &str) {
    let response = format!(
        "HTTP/1.1 {status}\r\nContent-Type: text/html; charset=utf-8\r\n\
         Content-Length: {}\r\nConnection: close\r\n\r\n{body}",
        body.len()
    );
    let _ = stream.write_all(response.as_bytes());
    let _ = stream.flush();
}

/// Binds the loopback port and resolves with the first request that actually
/// carries OAuth params. Incidental requests (favicon, preflight probes) are
/// answered and ignored so they cannot consume the one-shot listener.
#[tauri::command]
pub async fn spotify_oauth_listen(timeout_secs: u64) -> Result<OauthCallback, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let generation = LISTENER_GENERATION.fetch_add(1, Ordering::SeqCst) + 1;

        // A previous call may still hold the port; it will see the generation
        // change on its next poll and release it, so retry the bind briefly.
        let bind_deadline = Instant::now() + SUPERSEDE_GRACE;
        let listener = loop {
            match TcpListener::bind(("127.0.0.1", REDIRECT_PORT)) {
                Ok(listener) => break listener,
                Err(err) if err.kind() == std::io::ErrorKind::AddrInUse
                    && Instant::now() < bind_deadline =>
                {
                    std::thread::sleep(Duration::from_millis(100));
                }
                Err(err) => {
                    return Err(format!(
                        "Could not listen on 127.0.0.1:{REDIRECT_PORT} for the Spotify redirect: {err}"
                    ))
                }
            }
        };
        listener
            .set_nonblocking(true)
            .map_err(|err| err.to_string())?;

        let deadline = Instant::now() + Duration::from_secs(timeout_secs.clamp(10, 600));

        loop {
            if LISTENER_GENERATION.load(Ordering::SeqCst) != generation {
                return Err("Superseded by a newer Spotify connect attempt.".to_string());
            }
            if Instant::now() >= deadline {
                return Err("Timed out waiting for Spotify to redirect back.".to_string());
            }

            let (mut stream, _addr) = match listener.accept() {
                Ok(accepted) => accepted,
                Err(ref err) if err.kind() == std::io::ErrorKind::WouldBlock => {
                    std::thread::sleep(Duration::from_millis(120));
                    continue;
                }
                Err(err) => return Err(err.to_string()),
            };

            stream.set_nonblocking(false).ok();
            stream
                .set_read_timeout(Some(Duration::from_secs(5)))
                .ok();

            let mut request_line = String::new();
            let clone = match stream.try_clone() {
                Ok(clone) => clone,
                Err(_) => continue,
            };
            if BufReader::new(clone).read_line(&mut request_line).is_err() {
                continue;
            }

            let target = request_line.split_whitespace().nth(1).unwrap_or("/");
            let query = target.split_once('?').map(|(_, q)| q).unwrap_or("");

            let mut callback = OauthCallback {
                code: None,
                state: None,
                error: None,
            };
            for pair in query.split('&').filter(|pair| !pair.is_empty()) {
                let (key, value) = pair.split_once('=').unwrap_or((pair, ""));
                match key {
                    "code" => callback.code = Some(percent_decode(value)),
                    "state" => callback.state = Some(percent_decode(value)),
                    "error" => callback.error = Some(percent_decode(value)),
                    _ => {}
                }
            }

            if callback.code.is_none() && callback.error.is_none() {
                write_response(&mut stream, "404 Not Found", "");
                continue;
            }

            write_response(&mut stream, "200 OK", &callback_page(callback.code.is_some()));
            return Ok(callback);
        }
    })
    .await
    .map_err(|err| err.to_string())?
}

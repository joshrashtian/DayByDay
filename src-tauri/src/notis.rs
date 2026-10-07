use serde::Deserialize;
use std::collections::HashSet;
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_notification::NotificationExt;

#[derive(Deserialize, Clone)]
pub struct Scheduled {
    pub id: String,
    pub title: String,
    pub body: String,
    pub fire_at: i64, // unix ms
}

#[derive(Default)]
pub struct Inner {
    pending: Vec<Scheduled>,
    /// (id, fire_at) of everything already shown, so a re-sync that still
    /// contains a past-due item doesn't show it a second time.
    fired: HashSet<(String, i64)>,
}

#[derive(Default)]
pub struct Queue(pub Mutex<Inner>);

const FIRED_RETENTION_MS: i64 = 24 * 60 * 60 * 1000;

#[tauri::command]
pub fn schedule_notification(queue: State<Queue>, item: Scheduled) {
    let mut q = queue.0.lock().unwrap();
    q.pending.retain(|n| n.id != item.id); // re-scheduling the same id replaces it
    q.pending.push(item);
}

#[tauri::command]
pub fn cancel_notification(queue: State<Queue>, id: String) {
    queue.0.lock().unwrap().pending.retain(|n| n.id != id);
}

/// Replaces the whole pending queue. The frontend rebuilds the full list from
/// its tasks on launch and whenever they change, so edits and deletes need no
/// separate cancel call. Items whose time has already passed fire on the next
/// tick, unless that exact (id, fire_at) was shown before.
#[tauri::command]
pub fn sync_notifications(queue: State<Queue>, items: Vec<Scheduled>) {
    let now = chrono::Utc::now().timestamp_millis();
    let mut q = queue.0.lock().unwrap();
    q.fired.retain(|(_, at)| *at > now - FIRED_RETENTION_MS);
    let fired = &q.fired;
    let items: Vec<Scheduled> = items
        .into_iter()
        .filter(|n| !fired.contains(&(n.id.clone(), n.fire_at)))
        .collect();
    eprintln!("[notis] synced {} pending notification(s)", items.len());
    q.pending = items;
}

#[tauri::command]
pub fn send_notification(app: AppHandle, title: String, body: String) {
    show(&app, &title, &body);
}

fn show(app: &AppHandle, title: &str, body: &str) {
    eprintln!("[notis] showing \"{title}\"");
    if let Err(err) = app.notification().builder().title(title).body(body).show() {
        eprintln!("[notis] failed to show \"{title}\": {err}");
    }
}

pub fn start_scheduler(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        loop {
            let now = chrono::Utc::now().timestamp_millis();
            let due: Vec<Scheduled> = {
                let queue = app.state::<Queue>();
                let mut q = queue.0.lock().unwrap();
                let (due, rest): (Vec<_>, Vec<_>) =
                    q.pending.drain(..).partition(|n| n.fire_at <= now);
                q.pending = rest;
                for n in &due {
                    q.fired.insert((n.id.clone(), n.fire_at));
                }
                due
            }; // lock dropped here, before any sending
            for n in due {
                show(&app, &n.title, &n.body);
            }
            tokio::time::sleep(std::time::Duration::from_secs(15)).await;
        }
    });
}

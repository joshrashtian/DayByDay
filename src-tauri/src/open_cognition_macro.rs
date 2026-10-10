use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

const LABEL: &str = "cognition";

#[tauri::command]
pub async fn open_cognition_bar(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window(LABEL) {
        win.show().map_err(|e| e.to_string())?;
        win.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    let win =
        WebviewWindowBuilder::new(&app, LABEL, WebviewUrl::App("index.html#/cognition".into()))
            .title("Cognition Bar")
            .inner_size(840.0, 84.0)
            .decorations(false)
            .transparent(true)
            .shadow(false)
            .always_on_top(true)
            .resizable(false)
            .skip_taskbar(true)
            .center()
            .focused(true)
            .build()
            .map_err(|e| e.to_string())?;

    let handle = win.clone();
    win.on_window_event(move |event| {
        if let WindowEvent::Focused(false) = event {
            let _ = handle.hide();
        }
    });

    Ok(())
}

/// Hides the cognition bar (Escape, or after a task is added).
#[tauri::command]
pub fn hide_cognition_bar(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window(LABEL) {
        win.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn register_shortcut(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let shortcut = Shortcut::new(Some(Modifiers::ALT), Code::KeyR);

    app.plugin(
        tauri_plugin_global_shortcut::Builder::new()
            .with_handler(move |app, sc, event| {
                if sc == &shortcut && event.state() == ShortcutState::Pressed {
                    // Pressing the shortcut again while the bar is open closes it.
                    if let Some(win) = app.get_webview_window(LABEL) {
                        if win.is_visible().unwrap_or(false) {
                            let _ = win.hide();
                            return;
                        }
                    }
                    let app = app.clone();
                    tauri::async_runtime::spawn(async move {
                        let _ = open_cognition_bar(app).await;
                    });
                }
            })
            .build(),
    )?;
    app.global_shortcut().register(shortcut)?;

    Ok(())
}

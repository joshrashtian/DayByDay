#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder},
    Emitter,
};

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let settings_item = MenuItemBuilder::with_id("settings", "Settings...")
                .accelerator("CmdOrCtrl+,")
                .build(app)?;
            let app_menu = SubmenuBuilder::new(app, app.package_info().name.clone())
                .about(None)
                .separator()
                .item(&settings_item)
                .separator()
                .quit()
                .build()?;

            let create_task_item = MenuItemBuilder::with_id("create_task", "Create Task")
                .accelerator("CmdOrCtrl+N")
                .build(app)?;
            let task_menu = SubmenuBuilder::new(app, "Tasks")
                .item(&create_task_item)
                .build()?;

            let edit_menu = SubmenuBuilder::new(app, "Edit")
                .undo()
                .redo()
                .separator()
                .cut()
                .copy()
                .paste()
                .select_all()
                .build()?;

            let zoom_in_item = MenuItemBuilder::with_id("zoom_in", "Zoom In")
                .accelerator("CmdOrCtrl+=")
                .build(app)?;
            let zoom_out_item = MenuItemBuilder::with_id("zoom_out", "Zoom Out")
                .accelerator("CmdOrCtrl+-")
                .build(app)?;
            let actual_size_item = MenuItemBuilder::with_id("zoom_reset", "Actual Size")
                .accelerator("CmdOrCtrl+0")
                .build(app)?;
            let toggle_left_panel =
                MenuItemBuilder::with_id("toggle_left_panel", "Toggle Left Panel")
                    .accelerator("CmdOrCtrl+1")
                    .build(app)?;
            let toggle_right_panel =
                MenuItemBuilder::with_id("toggle_right_panel", "Toggle Right Panel")
                    .accelerator("CmdOrCtrl+2")
                    .build(app)?;

            let view_menu = SubmenuBuilder::new(app, "View")
                .item(&zoom_in_item)
                .item(&zoom_out_item)
                .item(&actual_size_item)
                .separator()
                .item(&toggle_left_panel)
                .item(&toggle_right_panel)
                .build()?;

            let go_menu = SubmenuBuilder::new(app, "Go")
                .text("home", "Home")
                .text("calendar", "Calendar")
                .text("tasks", "Tasks")
                .text("blocks", "Blocks")
                .text("pomodoro", "Pomodoro")
                .build()?;

            let menu = MenuBuilder::new(app)
                .item(&app_menu)
                .item(&edit_menu)
                .item(&view_menu)
                .item(&task_menu)
                .item(&go_menu)
                .build()?;

            app.set_menu(menu)?;

            app.on_menu_event(move |app_handle: &tauri::AppHandle, event| {
                match event.id().0.as_str() {
                    "home" => {
                        let _ = app_handle.emit("navigate", "home");
                    }
                    "calendar" => {
                        let _ = app_handle.emit("navigate", "calendar");
                    }
                    "tasks" => {
                        let _ = app_handle.emit("navigate", "tasks");
                    }
                    "blocks" => {
                        let _ = app_handle.emit("navigate", "blocks");
                    }
                    "pomodoro" => {
                        let _ = app_handle.emit("navigate", "pomodoro");
                    }
                    "settings" => {
                        let _ = app_handle.emit("navigate", "settings");
                    }
                    "create_task" => {
                        let _ = app_handle.emit("create-task", ());
                    }
                    "zoom_in" => {
                        let _ = app_handle.emit("menu-zoom", "in");
                    }
                    "zoom_out" => {
                        let _ = app_handle.emit("menu-zoom", "out");
                    }
                    "zoom_reset" => {
                        let _ = app_handle.emit("menu-zoom", "reset");
                    }
                    "toggle_left_panel" => {
                        let _ = app_handle.emit("toggle-left-panel", ());
                    }
                    "toggle_right_panel" => {
                        let _ = app_handle.emit("toggle-right-panel", ());
                    }
                    _ => {
                        // Ignore unrelated native menu events.
                    }
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri app");
}

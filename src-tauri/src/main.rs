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

            let go_menu = SubmenuBuilder::new(app, "Go")
                .text("home", "Home")
                .text("calendar", "Calendar")
                .text("tasks", "Tasks")
                .text("blocks", "Blocks")
                .build()?;

            let menu = MenuBuilder::new(app)
                .item(&app_menu)
                .item(&edit_menu)
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
                    "settings" => {
                        let _ = app_handle.emit("navigate", "settings");
                    }
                    "create_task" => {
                        let _ = app_handle.emit("create-task", ());
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

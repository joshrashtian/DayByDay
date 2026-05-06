#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri::{
    menu::{MenuBuilder, SubmenuBuilder},
    Emitter,
};

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_menu = SubmenuBuilder::new(app, app.package_info().name.clone())
                .about(None)
                .separator()
                .quit()
                .build()?;

            let actions_menu = SubmenuBuilder::new(app, "Actions")
                .text("open", "Open")
                .text("close", "Close")
                .build()?;

            let go_menu = SubmenuBuilder::new(app, "Go")
                .text("home", "Home")
                .text("calendar", "Calendar")
                .text("tasks", "Tasks")
                .text("blocks", "Blocks")
                .build()?;

            let menu = MenuBuilder::new(app)
                .item(&app_menu)
                .item(&actions_menu)
                .item(&go_menu)
                .build()?;

            app.set_menu(menu)?;

            app.on_menu_event(move |_app_handle: &tauri::AppHandle, event| {
                println!("menu event: {:?}", event.id());

                match event.id().0.as_str() {
                    "open" => {
                        println!("open event");
                    }
                    "close" => {
                        println!("close event");
                    }
                    _ => {
                        println!("unexpected menu event");
                    }
                }
            });

            app.on_menu_event(move |_app_handle: &tauri::AppHandle, event| {
                println!("menu event: {:?}", event.id());

                match event.id().0.as_str() {
                    "home" => {
                        println!("home event");
                        _app_handle.emit("navigate", "home").unwrap();
                    }
                    "calendar" => {
                        _app_handle.emit("navigate", "calendar").unwrap();
                    }
                    "tasks" => {
                        _app_handle.emit("navigate", "tasks").unwrap();
                    }
                    "blocks" => {
                        _app_handle.emit("navigate", "blocks").unwrap();
                    }
                    _ => {
                        println!("unexpected menu event");
                    }
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri app");
}

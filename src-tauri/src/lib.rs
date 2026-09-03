use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                // Fetch all open webview windows in the application
                let app_handle = window.app_handle();
                // Close every single open window
                for w in app_handle.webview_windows().values() {
                    let _ = w.close();
                }
            }
        })
        .setup(|app| {
            #[cfg(target_os = "linux")]
            {
                use tauri::Manager;
                use webkit2gtk::{PermissionRequestExt, WebViewExt};

                let window = app.get_webview_window("main").unwrap();
                window.with_webview(|webview| {
                    let wv = webview.inner();

                    // Enable WebGL
                    // if let Some(settings) = wv.settings() {
                    //     settings.set_enable_webgl(true);
                    //     settings.set_enable_write_console_messages_to_stdout(true); // helpful for debug
                    //     settings.set_hardware_acceleration_policy(
                    //         webkit2gtk::HardwareAccelerationPolicy::Always  // ← force it on
                    //     );
                    // }
                    wv.connect_permission_request(|_, request| {
                        request.allow();
                        true
                    });
                })?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

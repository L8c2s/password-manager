// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};

use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};

use std::fs;
use std::fs::File;
use std::io::Read;
use std::path::Path;

#[derive(Serialize, Deserialize)]
struct AppConfig {
    lang: String,
    sort_filter: String,
    password_hash: String,
}

fn save_config(path: String, data: String) -> Result<(), Box<dyn std::error::Error>> {
    fs::write(&path, &data)?;
    Ok(())
}

fn read_config(config_directory: &String) -> AppConfig {
    let path = Path::new(&config_directory);
    let mut current_config = String::new();
    let mut raw_file = File::open(path).expect("File could not be openned.");
    raw_file
        .read_to_string(&mut current_config)
        .expect("File could not be read.");
    serde_json::from_str(&current_config).unwrap()
}

#[tauri::command]
fn receive_user_password(
    user_password: String,
    first_time: bool,
    config_directory: String,
) -> bool {
    let mut app_config = read_config(&config_directory);
    if first_time {
        let salt = SaltString::generate(&mut OsRng);
        let password_hash = Argon2::default()
            .hash_password(user_password.as_bytes(), &salt)
            .unwrap()
            .to_string();
        app_config.password_hash = password_hash;
        match save_config(
            config_directory,
            serde_json::to_string(&app_config).unwrap(),
        ) {
            Ok(_) => println!("Password saved."),
            Err(_) => println!("Could not save password."),
        }

        true
    } else {
        let saved_hash = app_config.password_hash;

        let parsed_hash = PasswordHash::new(&saved_hash).unwrap();
        return Argon2::default()
            .verify_password(user_password.as_bytes(), &parsed_hash)
            .is_ok();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![receive_user_password])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

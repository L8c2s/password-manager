// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};

use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};

use lazy_static::lazy_static;

use std::fs::File;
use std::io::Read;
use std::path::Path;
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::{fs, num::NonZeroU32};

use rand::Rng;
use ring::pbkdf2;
use ring::{
    aead::{Aad, LessSafeKey, Nonce, UnboundKey, AES_256_GCM},
    rand::{SecureRandom, SystemRandom},
};

use base64::{engine::general_purpose, Engine as _};

#[derive(Serialize, Deserialize)]
struct AppConfig {
    lang: String,
    sort_filter: String,
    password_hash: String,
}

struct AppState {
    master_password: Option<String>,
}

lazy_static! {
    static ref APP_STATE: Arc<Mutex<AppState>> = Arc::new(Mutex::new(AppState {
        master_password: None
    }));
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

fn store_password(master_password: String) {
    let mut state = APP_STATE.lock().unwrap();
    state.master_password = Some(master_password);
}

fn get_password() -> Option<String> {
    let state = APP_STATE.lock().unwrap();
    state.master_password.clone()
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

        store_password(user_password);
        true
    } else {
        let saved_hash = app_config.password_hash;

        let parsed_hash = PasswordHash::new(&saved_hash).unwrap();
        let ok = Argon2::default()
            .verify_password(user_password.as_bytes(), &parsed_hash)
            .is_ok();

        if ok {
            store_password(user_password);
        }

        ok
    }
}

fn derive_password(master_password: &String) -> [u8; 32] {
    let mut salt = [0u8; 16];
    rand::thread_rng().fill(&mut salt);

    let mut key = [0u8; 32];
    pbkdf2::derive(
        pbkdf2::PBKDF2_HMAC_SHA256,
        NonZeroU32::new(100_000).unwrap(),
        &salt,
        master_password.as_bytes(),
        &mut key,
    );

    key
}

fn get_encrypted_password(key: &[u8; 32], password: String) -> String {
    let unbound_key = UnboundKey::new(&AES_256_GCM, key)
        .map_err(|_| "Error creating key.")
        .unwrap();
    let encrypted_key = LessSafeKey::new(unbound_key);

    let mut nonce = [0u8; 12];
    SystemRandom::new()
        .fill(&mut nonce)
        .map_err(|_| "Could not generate random nonce.")
        .unwrap();

    let nonce_ref = Nonce::assume_unique_for_key(nonce);

    let mut password_bytes = password.as_bytes().to_vec();
    password_bytes.extend_from_slice(&[0; 16]);
    encrypted_key
        .seal_in_place_append_tag(nonce_ref, Aad::empty(), &mut password_bytes)
        .map_err(|_| "Error encrypting password.")
        .unwrap();

    let mut all_data = Vec::new();
    all_data.extend_from_slice(key);
    all_data.extend_from_slice(&nonce);
    all_data.extend_from_slice(&password_bytes);

    general_purpose::STANDARD.encode(all_data)
}

fn get_decrypted_password(encrypted_password: Vec<u8>) -> Result<String, &'static str> {
    if encrypted_password.len() < 44 {
        return Err("");
    }

    let (key, nencrypted) = encrypted_password.split_at(32);
    let (nonce, encrypted_password) = nencrypted.split_at(12);

    let unbound_key = UnboundKey::new(&AES_256_GCM, key).map_err(|_| "Error creating key.")?;
    let encrypted_key = LessSafeKey::new(unbound_key);
    let nonce = Nonce::try_assume_unique_for_key(nonce).map_err(|_| "Error creating nonce.")?;

    let mut bytes_password = encrypted_password.to_owned();
    let decrypted_password = encrypted_key
        .open_in_place(nonce, Aad::empty(), &mut bytes_password)
        .map_err(|_| "Error trying to decrypt password")?;

    let password;
    if let Some(pos) = decrypted_password.iter().position(|&x| x == 0) {
        password = String::from_utf8(decrypted_password[..pos].to_vec())
            .map_err(|_| "Error converting password to String.")?;
    } else {
        password = String::from_utf8(decrypted_password.to_vec())
            .map_err(|_| "Error converting password to String.")?;
    }

    Ok(password)
}

#[tauri::command]
fn encrypt_password(password: String) -> String {
    let master_password = get_password().expect("Error: Master Password was not defined.");
    let key = derive_password(&master_password);
    get_encrypted_password(&key, password)
}

#[tauri::command]
fn decrypt_password(encrypted_password: String) -> String {
    let from_base64 = match general_purpose::STANDARD.decode(&encrypted_password) {
        Ok(decoded) => decoded,
        Err(_) => return encrypted_password,
    };

    match get_decrypted_password(from_base64) {
        Ok(decrypted_password) => decrypted_password,
        Err(_) => encrypted_password,
    }
}

#[tauri::command]
fn open_backup_folder(backup_dir: String) {
    println!("{}", backup_dir);
    Command::new("explorer")
        .arg(backup_dir)
        .status()
        .expect("Failed to open the backup folder.");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            receive_user_password,
            encrypt_password,
            decrypt_password,
            open_backup_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

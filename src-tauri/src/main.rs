// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};

use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};

use lazy_static::lazy_static;

use core::str;
use std::process::Command;
use std::sync::{Arc, Mutex};

use ring::{
    aead::*,
    rand::{SecureRandom as _, SystemRandom},
};

use base64::{engine::general_purpose, Engine as _};

use chrono::prelude::*;

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

fn store_password(master_password: String) {
    let mut state = APP_STATE.lock().unwrap();
    state.master_password = Some(master_password);
}

fn get_password() -> String {
    let state = APP_STATE.lock().unwrap();
    state.master_password.clone().unwrap_or_default()
}

#[tauri::command]
fn receive_user_password(user_password: String, first_time: bool, config: String) -> String {
    // receive the master password
    // checks if it is the first time that the user is accessing the program,
    // if true, create a hash of the password and save it in memory and in the config file
    // else, load the hash saved and checks if it is the same password

    let mut conf: AppConfig = serde_json::from_str(&config).unwrap();

    if first_time {
        let salt = SaltString::generate(&mut OsRng);
        let password_hash = Argon2::default()
            .hash_password(user_password.as_bytes(), &salt)
            .unwrap()
            .to_string();

        conf.password_hash = password_hash.clone();
        store_password(user_password);

        serde_json::to_string(&conf).unwrap()
    } else {
        let saved_hash = conf.password_hash.clone();

        let parsed_hash = PasswordHash::new(&saved_hash)
            .map_err(|e| e.to_string())
            .unwrap();

        let ok = Argon2::default()
            .verify_password(user_password.as_bytes(), &parsed_hash)
            .is_ok();
        if ok {
            store_password(user_password);
            serde_json::to_string(&conf).unwrap()
        } else {
            "false".to_string()
        }
    }
}

fn derive_key(salt: &[u8]) -> [u8; 32] {
    let master_password = get_password();
    let mut output_key = [0u8; 32];
    let out_key = match Argon2::default().hash_password_into(
        master_password.as_bytes(),
        salt,
        &mut output_key,
    ) {
        Ok(_) => output_key,
        Err(_) => [0u8; 32],
    };

    out_key
}

fn derive_new_key() -> ([u8; 32], [u8; 16]) {
    let mut salt = [0u8; 16];
    SystemRandom::new().fill(&mut salt).unwrap();

    // println!("\n---------- New Key Derivation Test ----------");
    // println!("Salt: {:?}", salt);
    // println!("-------------------------------------");

    let output_key = derive_key(&salt);
    (output_key, salt)
}

#[tauri::command]
fn test_derivation() {
    let (new_output_key, salt) = derive_new_key();
    let output_key = derive_key(&salt);

    println!("\n---------- Derivation Test ----------");
    println!("New output key: {:?}", new_output_key);
    println!("Output key: {:?}", output_key);
    println!("Salt: {:?}", salt);

    if new_output_key == output_key {
        println!("Passed.");
    } else {
        println!("Failed.")
    }

    println!("-------------------------------------");
}

#[tauri::command]
fn encrypt_password(password: String) -> String {
    if password.is_empty() {
        return password;
    }

    println!("Processing encryption...");

    let (key, salt) = derive_new_key();

    let mut encrypted_password = password.as_bytes().to_vec().clone();
    encrypted_password.extend_from_slice(&[0; 16]);
    let unbound_key = UnboundKey::new(&AES_256_GCM, &key).unwrap();

    let mut nonce = [0u8; 12];
    SystemRandom::new().fill(&mut nonce).unwrap();
    let nonce_ref = Nonce::assume_unique_for_key(nonce);

    let less_safe_key = LessSafeKey::new(unbound_key);
    less_safe_key
        .seal_in_place_append_tag(nonce_ref, Aad::empty(), &mut encrypted_password)
        .unwrap();

    let mut all_data = Vec::new();
    all_data.extend_from_slice(&salt);
    all_data.extend_from_slice(&nonce);
    all_data.extend_from_slice(&encrypted_password);

    general_purpose::STANDARD.encode(all_data)
}

#[tauri::command]
fn encryption_test(test_string: String) {
    let encrypted_string = encrypt_password(test_string);
    let from_base64_string = general_purpose::STANDARD.decode(encrypted_string).unwrap();
    let (salt, encrypted_string) = from_base64_string.split_at(16);
    let (nonce, encrypted_string) = encrypted_string.split_at(12);

    println!("\n---------- Encryption Test ----------");
    println!("Salt: {:?}", salt);
    println!("Nonce: {:?}", nonce);
    println!("Encrypted string: {:?}", encrypted_string);
    println!("-------------------------------------");
}

#[tauri::command]
fn decrypt_password(encrypted_password: String) -> String {
    if encrypted_password.is_empty() {
        return encrypted_password;
    }

    println!("Processing decryption...");

    let encrypted_copy = encrypted_password.clone();

    let from_base64 = general_purpose::STANDARD
        .decode(encrypted_password.clone())
        .unwrap_or_default();

    if from_base64.is_empty() {
        return encrypted_password;
    }

    if from_base64.len() < 38 {
        return encrypted_password;
    }

    let (salt, encrypted_password) = from_base64.split_at(16);
    let (nonce, encrypted_password) = encrypted_password.split_at(12);
    let key = derive_key(salt);

    // println!("\n---------- Decryption Split Test ----------");
    // println!("Salt: {:?}", salt);
    // println!("Nonce: {:?}", nonce);
    // println!("Encrypted password: {:?}", encrypted_password);
    // println!("-------------------------------------------");

    let unbound_key = UnboundKey::new(&AES_256_GCM, &key).unwrap();
    let nonce_ref = Nonce::try_assume_unique_for_key(nonce).unwrap();
    let less_safe_key = LessSafeKey::new(unbound_key);

    let mut decrypted_password = encrypted_password.to_owned();
    if less_safe_key
        .open_in_place(nonce_ref, Aad::empty(), &mut decrypted_password)
        .is_err()
    {
        return encrypted_copy;
    }

    // println!("\n---------- Decryption Result Test ----------");
    // println!("Decrypted password: {:?}", decrypted_password);
    // println!("--------------------------------------------");

    let password;
    if let Some(pos) = decrypted_password.iter().position(|&x| x == 0) {
        password = String::from_utf8(decrypted_password[..pos].to_vec()).unwrap();
    } else {
        password = String::from_utf8(decrypted_password.to_vec()).unwrap();
    }

    password
}

#[tauri::command]
fn decryption_test(test_string: String) {
    let original_string = test_string.clone();
    let encrypted_string = encrypt_password(test_string);
    let decrypted_string = decrypt_password(encrypted_string);

    println!("\n---------- Decryption Test ----------");
    println!("Decrypted string: {}", decrypted_string);

    if decrypted_string == original_string {
        println!("Passed.");
    } else {
        println!("Failed.");
    }

    println!("-------------------------------------");
}

#[tauri::command]
fn open_folder(directory: String) {
    Command::new("explorer")
        .arg(directory)
        .status()
        .expect("Failed to open the specified directory.");
}

#[tauri::command]
fn get_date_time() -> String {
    let local: DateTime<Local> = Local::now();
    local.format("%Y-%m-%d %H:%M:%S").to_string()
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
            test_derivation,
            encryption_test,
            decryption_test,
            open_folder,
            get_date_time
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

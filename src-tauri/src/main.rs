// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashMap;

#[tauri::command]
fn serialize(accounts: String) -> String {
    println!("Received accounts: {}", accounts);
    // convert the argument to a HashMap
    let hash_accounts: HashMap<String, Vec<HashMap<String, String>>> = serde_json::from_str(&accounts.to_string()).unwrap();
    // convert the Account to a JSON string
    let serialized: String = serde_json::to_string(&hash_accounts).unwrap();
    serialized
}

#[tauri::command]
fn deserialize(accounts: String) -> HashMap<String, Vec<HashMap<String, String>>> {
    // println!("{}", accounts);
    let deserialized: HashMap<String, Vec<HashMap<String, String>>> = serde_json::from_str(&accounts.to_string()).unwrap();
    deserialized
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![serialize, deserialize])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

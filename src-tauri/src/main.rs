// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashMap;

#[tauri::command]
fn serialize(service: String, username: String, password: String, notes: String) -> String {
    let mut accounts: HashMap<String, Vec<HashMap<String, String>>> = HashMap::new();
    let mut new_account: HashMap<String, String> = HashMap::new();

    new_account.insert(
        "service".to_string(),
        service.to_string()
    );
    new_account.insert(
        "username".to_string(),
        username.to_string()
    );
    new_account.insert(
        "password".to_string(),
        password.to_string()
    );
    new_account.insert(
        "notes".to_string(),
        notes.to_string()
    );

    accounts.insert(
        "Google".to_string(),
        vec![new_account]
    );

    // convert the Account to a JSON string
    let serialized: String = serde_json::to_string(&accounts).unwrap();
    serialized
}

#[tauri::command]
fn deserialize(accounts: String) -> HashMap<String, Vec<HashMap<String, String>>> {
    let deserialized: HashMap<String, Vec<HashMap<String, String>>> = serde_json::from_str(&accounts).unwrap();
    deserialized
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![serialize, deserialize])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

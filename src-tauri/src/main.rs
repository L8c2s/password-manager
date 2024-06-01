// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use chrono::Local;
use std::fs;

#[tauri::command]
fn backup() {
    let binding = fs::read_to_string("paths.txt").expect("");
    let mut all_paths = binding.split("\n");

    let main_path = all_paths.next().unwrap();
    let json_path = all_paths.next().unwrap();
    let text_path = all_paths.next().unwrap();
    let ids_path = all_paths.next().unwrap();

    let dir_name = Local::now().format("%Y%m%d-%H%M%S").to_string();
    let backup_path = format!("{}\\backup\\{}", main_path, dir_name);

    if cfg!(target_os = "windows") {
        let mkdir = Command::new("cmd")
            .args(&["/C", &format!("mkdir {}", backup_path)])
            .output()
            .expect("Failed to create the backup folder.");

        let copy_json = Command::new("cmd")
            .args(&["/C", &format!("copy {} {}\\accounts.json", json_path, backup_path)])
            .output()
            .expect("Failed to copy the accounts.json file.");

        let copy_text = Command::new("cmd")
            .args(&["/C", &format!("copy {} {}\\accounts.txt", text_path, backup_path)])
            .output()
            .expect("Failed to copy the accounts.txt file.");

        let copy_ids = Command::new("cmd")
            .args(&["/C", &format!("copy {} {}\\ids.json", ids_path, backup_path)])
            .output()
            .expect("Failed to copy the ids.json file.");

        let mkdir_output = String::from_utf8_lossy(&mkdir.stdout);
        let copy_json_output = String::from_utf8_lossy(&copy_json.stdout);
        let copy_text_output = String::from_utf8_lossy(&copy_text.stdout);
        let copy_ids_output = String::from_utf8_lossy(&copy_ids.stdout);

        println!();
        println!("mkdir: {}", mkdir_output.to_string());
        println!("copy: {}", copy_json_output.to_string());
        println!("copy: {}", copy_text_output.to_string());
        println!("copy: {}", copy_ids_output.to_string());
    } else {
        println!("Cannot create and save the backup: not using Windows.");
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![backup])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
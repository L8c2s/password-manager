// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use chrono::Local;

#[tauri::command]
fn backup() {
    let main_path = "C:\\Users\\luhlu\\Documents\\passwords".to_string();
    let backup_path = main_path.clone() + "\\backup";
    let test_path = main_path.clone() + "\\tests";

    let dir_name = Local::now().format("%Y%m%d-%H%M%S").to_string();

    println!("mkdir {}\\{}", &backup_path, &dir_name);
    println!("copy {}\\accounts.json {}\\{}\\accounts.json", &test_path, &backup_path, &dir_name);

    if cfg!(target_os = "windows") {
        let mkdir = Command::new("cmd")
            .args(&["/C", &format!("mkdir {}\\{}", backup_path, dir_name)])
            .output()
            .expect("Failed to create the backup folder.");

        let copy = Command::new("cmd")
            .args(&["/C", &format!("copy {}\\accounts.json {}\\{}\\accounts.json", test_path, backup_path, dir_name)])
            .output()
            .expect("Failed to copy the file.");

        let copy_text = Command::new("cmd")
            .args(&["/C", &format!("copy {}\\accounts.txt {}\\{}\\accounts.txt", test_path, backup_path, dir_name)])
            .output()
            .expect("Failed to copy the file.");

        let mkdir_output = String::from_utf8_lossy(&mkdir.stdout);
        let copy_output = String::from_utf8_lossy(&copy.stdout);
        let copy_text_output = String::from_utf8_lossy(&copy_text.stdout);

        println!();
        println!("mkdir: {}", mkdir_output.to_string());
        println!("copy: {}", copy_output.to_string());
        println!("text copy: {}", copy_text_output.to_string());
    } else {
        println!("Cannot create and save the backup: not in Windows.");
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![backup])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

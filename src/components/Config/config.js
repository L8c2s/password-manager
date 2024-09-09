import { readTextFile, writeTextFile, exists } from "@tauri-apps/api/fs";


const CONFIGPATH = "./config/config.json"
const DEBUGCONFIGPATH = "D:/OtherProjects/Tauri/password-manager/src/components/Config/config/config.json"

// todo: create a verification for important folders and files that the program needs to work properly, like ./config/config.json

export async function saveConfig(newConfig, func) {
    newConfig = JSON.stringify(newConfig);
    console.log(`Saving ${newConfig}. Called by ${func}.`)
    try {
        await writeTextFile(CONFIGPATH, newConfig);
    } catch {
        await writeTextFile(DEBUGCONFIGPATH, newConfig);
    }
}

export async function loadConfig() {
    let config;
    try {
        config = JSON.parse(await readTextFile(CONFIGPATH));
    } catch {
        try {
            config = JSON.parse(await readTextFile(DEBUGCONFIGPATH));
        } catch {
            config = false;
        }
    }

    if (!config || !config.hasOwnProperty("accounts_dir") || !config.hasOwnProperty("lang")) {
        config = { accounts_dir: "", lang: "pt-BR", sort_filter: "noFilter" }
        await saveConfig(config, "loadConfig");
    }

    return config;
}

export async function getConfigValue(key) {
    let config = await loadConfig();
    if (config.hasOwnProperty(key))
        return config[key];
}

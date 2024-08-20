import { readTextFile, writeTextFile, exists } from "@tauri-apps/api/fs";


const CONFIGPATH = "./config/config.json"
const DEBUGCONFIGPATH = "D:/OtherProjects/Tauri/password-manager/src/components/Config/config/config.json"

export async function saveConfig(newConfig) {
    newConfig = JSON.stringify(newConfig);
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
        config = JSON.parse(await readTextFile(DEBUGCONFIGPATH));
    }

    if (!config || !config.hasOwnProperty("accounts_dir") || !config.hasOwnProperty("lang")) {
        config = { accounts_dir: "", lang: "en-US" }
        await saveConfig(config);
    }

    return config;
}

export async function getConfigValue(key) {
    let config = await loadConfig();
    if (!config.hasOwnProperty(key)) {
        return null;
    }
    return config[key];
}

import { readTextFile, writeTextFile } from "@tauri-apps/api/fs";


const CONFIGPATH = "./config/config.json"
const DEBUGCONFIGPATH = "D:/OtherProjects/Tauri/password-manager/src/components/Config/config/config.json"

// todo: create a verification for important folders and files that the program needs to work properly, like ./config/config.json

export async function saveConfig(newConfig) {
    newConfig = JSON.stringify(newConfig);
    try {
        await writeTextFile(CONFIGPATH, newConfig);
    } catch {
        await writeTextFile(DEBUGCONFIGPATH, newConfig);
    }
}

export async function editConfigKey(key, value) {
    let config = await loadConfig();
    config[key] = value;
    await saveConfig(config);
}

export async function loadConfig() {
    let config;
    try {
        let textFile = await readTextFile(CONFIGPATH);
        config = JSON.parse(textFile);
    } catch (error) {
        try {
            let textFile = await readTextFile(DEBUGCONFIGPATH);
            config = JSON.parse(textFile);
        } catch (debugerror) {
            config = false;
        }
    }

    if (!config || !config.hasOwnProperty("accounts_dir") || !config.hasOwnProperty("lang")) {
        config = { accounts_dir: "", lang: "pt-BR", sort_filter: "created" }
        await saveConfig(config);
    }

    return config;
}

export async function getConfigValue(key) {
    let config = await loadConfig();
    if (config.hasOwnProperty(key))
        return config[key];
}

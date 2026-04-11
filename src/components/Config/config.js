import { BaseDirectory, mkdir, exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { appDataDir } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/core";


const MAINPATH = await appDataDir();
const CONFIGPATH = `config`;

if (!await exists(MAINPATH)) {
    await mkdir(MAINPATH);
} if (!await exists(`${MAINPATH}/backup`)) {
    await mkdir(`${MAINPATH}/backup`)
}

export async function saveConfig(newConfig, call=null) {
    // console.log(`[${call}] Saving config...`);
    try {
        newConfig = JSON.stringify(newConfig);
    } catch (error) {
        console.log("[saveConfig] Could not stringify to save: ", error);
        return;
    }

    await writeTextFile(CONFIGPATH, newConfig, { baseDir: BaseDirectory.AppData });
}

export async function loadConfig() {
    let config

    try {
        config = await readTextFile(CONFIGPATH, { baseDir: BaseDirectory.AppData });

        if (typeof config == ArrayBuffer) {
            config = new TextDecoder("utf-8").decode(config);
        }
    } catch (error) {
        console.log("[loadConfig] Could not load the config file: ", error);
        if (!config) {
            config = "{}";
        }
    }

    if (!config) config = "{}";
    return checkConfig(JSON.parse(config));
}

export function checkConfig(config) {
    if (!config) config = {};
    if (!config.lang) config.lang = "pt-BR";
    if (!config.sort_filter) config.sort_filter = "serviceName";
    if (!config.password_hash) config.password_hash = "";

    return config;
}

export async function setKey(key=null, value=null) {
    if (key === null || value === null) return;

    let config = await loadConfig();
    config[key] = value;
    await saveConfig(config);

    return config;
}
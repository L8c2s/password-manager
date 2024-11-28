import { BaseDirectory, mkdir, exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { appDataDir } from "@tauri-apps/api/path";


const MAINPATH = await appDataDir();
const CONFIGPATH = `config.json`;

if (!await exists(MAINPATH)) {
    await mkdir(MAINPATH);
} if (!await exists(`${MAINPATH}/backup`)) {
    await mkdir(`${MAINPATH}/backup`)
}

export async function saveConfig(newConfig) {
    newConfig = JSON.stringify(newConfig);
    await writeTextFile(CONFIGPATH, newConfig, { baseDir: BaseDirectory.AppData });
}

export async function editConfigKey(key, value) {
    let config = await loadConfig();
    config[key] = value;
    await saveConfig(config);
}

export async function loadConfig() {
    let config;
    try {
        let textFile = await readTextFile(CONFIGPATH, { baseDir: BaseDirectory.AppData });
        config = JSON.parse(textFile);
    } catch (error) {
        config = false;
        console.log("Could not load config file: ", error);
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    if (!config) {
        config = { lang: "pt-BR", sort_filter: "serviceName", password_hash: "" }
        await saveConfig(config);
    } else {
        config["lang"] = config["lang"] ?? "pt-BR";
        config["sort_filter"] = config["sort_filter"] ?? "serviceName";
        config["password_hash"] = config["password_hash"] ?? "";
    }

    return config;
}

export async function getConfigValue(key) {
    let config = await loadConfig();
    if (config.hasOwnProperty(key))
        return config[key];
}

export function findCorrectLeft(popup) {
    if (popup) {
        let leftValue = Math.round((window.innerWidth - popup.offsetWidth) / 2);
        popup.style.left = `${leftValue}px`;
    }
}

export function findCorrectMarginLeft(elementsList, windowPercent) {
    if (elementsList) {
        elementsList.forEach(item => {
            const element = document.getElementById(item.id);
            let leftValue = Math.round((window.innerWidth * (windowPercent / 100) - element.offsetWidth) / 2);
            element.style.marginLeft = `${leftValue}px`;
        })
    }
}
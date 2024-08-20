import { readTextFile, exists } from "@tauri-apps/api/fs";

const LANGPATH = "./lang"
const DEBUGLANGPATH = "D:/OtherProjects/Tauri/password-manager/src/components/Config/lang"

export async function loadLangFile(langSet) {
    let langFile;
    try {
        langFile = await readTextFile(`${LANGPATH}/${langSet}.json`);
    } catch {
        langFile = await readTextFile(`${DEBUGLANGPATH}/${langSet}.json`);
    }

    if (!langFile) {
        return null;
    }

    return JSON.parse(langFile);
}

export async function getMsgLang(lang, key, sub=null) {
    const langFile = await loadLangFile(lang);

    if (sub) {
        try {
            return langFile[key][sub];
        } catch {
            return null;
        }
    }

    return langFile[key] ? langFile.hasOwnProperty(key) : null;
}
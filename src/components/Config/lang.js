import { readTextFile, exists } from "@tauri-apps/api/fs";

const LANGPATH = "./lang"
const DEBUGLANGPATH = "D:/OtherProjects/Tauri/password-manager/src/components/Config/lang"

export async function loadLangFile(langSet) {
    let langFile;
    try {
        let path = `${LANGPATH}/${langSet}.json`;
        if (await exists(path))
            langFile = await readTextFile(path);
        else
            throw Error();
    } catch {
        let path = `${DEBUGLANGPATH}/${langSet}.json`;
        if (await exists(path))
            langFile = await readTextFile(path);
        else
            langFile = false;
    }

    if (!langFile) {
        return null;
    }

    return JSON.parse(langFile);
}

export function getMsg(langFile, key, sub) {
    if (!langFile) return null;

    if (!langFile.hasOwnProperty(key)) return null;
    if (!langFile[key].hasOwnProperty(sub)) return null;
    return langFile[key][sub];
}
import { React, useEffect, useRef, useState } from "react";
import { open } from "@tauri-apps/api/dialog";
import { writeFile } from "@tauri-apps/api/fs";

import "./Settings.css";

import { editConfigKey, getConfigValue } from "../Config/config";
import { getMsgLang } from "../Config/lang";


export function Settings({ settingsPopup, setSettingsPopup, langSet, accounts }) {
    const [updateLangSet, setUpdateLangSet] = useState("");
    const [accountsDirValue, setAccountsDirValue] = useState("");
    const [textFilePath, setTextFilePath] = useState("");
    const createdConfirmation = useRef(null);

    useEffect(() => {
        const loadAccountsDir = async () => {
            let dir = await getConfigValue("accounts_dir");
            let dirValue = "";

            if (dir && dir !== "") {
                dirValue = dir.split("\\");
                dirValue = `${dirValue[dirValue.length-2]}\\${dirValue[dirValue.length-1]}`;
            }

            setAccountsDirValue(dirValue);
        }

        loadAccountsDir();
    }, []);

    const changeAccountsDir = async () => {
        let accountsDirPath = await open({
            directory: true,
            multiple: false,
            defaultPath: "$DOCUMENT"
        });
        if (!accountsDirPath)
            return null;

        accountsDirPath += "\\PasswordManager";

        await editConfigKey("accounts_dir", accountsDirPath);
        await new Promise(resolve => setTimeout(resolve, 100));
        location.reload();
    }

    const changeLanguage = async (language) => {
        if (language === langSet)
            return null;

        await editConfigKey("lang", language);
        location.reload();
    }

    const generateTextFileContent = async () => {
        const username = await getMsgLang(langSet, "AccountInfo", "username.title");
        const password = await getMsgLang(langSet, "AccountInfo", "password.title");
        const notes = await getMsgLang(langSet, "AccountInfo", "notes.title");
        
        let content = "";

        for (const service in accounts) {
            if (accounts[service].length <= 0) continue;
            content += service.toUpperCase();

            for (let i = 0; i < accounts[service].length; i++) {
                const acc = accounts[service][i]
                content += `\n  ${username.toLowerCase()}: ${acc.username}`;
                content += `\n  ${password.toLowerCase()}: ${acc.password}`;
                if (acc.notes) {
                    content += `\n  ${notes.toLowerCase()}: ${acc.notes}`;
                }

                content += "\n";
            }

            content += "\n";
        }

        // todo: finish the language file
        // todo: this function already works, send it to git and start encryption process

        return content;
    }

    const createTextFile = async () => {
        let accountsDirPath = await open({
            multiple: false,
            directory: true,
            defaultPath: "$DOCUMENT"
        });

        if (!accountsDirPath) return;

        const filePath = accountsDirPath + "\\accounts.txt";
        setTextFilePath(filePath);

        const textFileContent = await generateTextFileContent();

        try {
            await writeFile(filePath, textFileContent);
            createdConfirmation.current.style = "display: block;";
        } catch {}
    }

    // ------------------------------ //

    const [title, setTitle] = useState("");
    const [changeAccDirText, setChangeAccDirText] = useState("");
    const [accountsDirPlhd, setAccountsDirPlhd] = useState("");
    const [monthsToUpdatePassTitle, setMonthsToUpdatePassTitle] = useState("");
    const [accountsDirTitle, setChangeAccDirTitle] = useState("");
    const [appLangTitle, setAppLangTitle] = useState("");
    const [updateLangText, setUpdateLangText] = useState("");
    const [createTextFileTitle, setCreateTextFileTitle] = useState("");
    const [fileCreatedText, setFileCreatedText] = useState("");
    const [textFileExplanation, setTextFileExplanation] = useState("");
    const [selectFolderText, setSelectFolderText] = useState("");

    useEffect(() => {
        const update = async () => {
            setTitle(await getMsgLang(langSet, "Settings", ".title"));
            setAccountsDirPlhd(await getMsgLang(langSet, "Settings", "accounts-dir.placeholder"))
            setChangeAccDirText(await getMsgLang(langSet, "Settings", "change-accounts-dir.text"));
            setMonthsToUpdatePassTitle(await getMsgLang(langSet, "Settings", "months-to-update-pass.title"));
            setChangeAccDirTitle(await getMsgLang(langSet, "Settings", "change-accounts-dir.title"));
            setAppLangTitle(await getMsgLang(langSet, "Settings", "app-language-title.title"));
            setUpdateLangText(await getMsgLang(langSet, "Settings", "update-language.text"));
            setCreateTextFileTitle(await getMsgLang(langSet, "Settings", "create-text-file.title"));
            setFileCreatedText(await getMsgLang(langSet, "Settings", "create-text-file.created"));
            setTextFileExplanation(await getMsgLang(langSet, "Settings", "create-text-file.explanation"));
            setSelectFolderText(await getMsgLang(langSet, "Settings", "create-text-file.select_folder"));
        }

        update();
        setUpdateLangSet(langSet);
    }, [langSet]);

    useEffect(() => {
        const on = () => {
            let settings_full_window = document.getElementById("settings-full-window");
            settings_full_window.style.display = "block";
            settings_full_window.className = "zoom-in";
        }

        const off = () => {
            let settings_full_window = document.getElementById("settings-full-window");
            settings_full_window.className = "zoom-out";
            setTimeout(() => settings_full_window.style.display = "none", 500);
            createdConfirmation.current.style = "display: none;";
        }

        if (settingsPopup) {
            on()
        } else {
            off()
        }
    }, [settingsPopup])

    return (
        <div id="settings-full-window">
            <div id="settings-blur"
                onClick={ () => { setSettingsPopup(false) } }
            ></div>

            <div id="settings-window">
                <div id="title-div">
                    <h1 id="settings-title">{title}</h1>
                </div>

                <div id="content">
                    <div id="accounts-directory" className="settings-content">
                        <h3 id="change-accounts-dir-title">{accountsDirTitle}</h3>
                        <input type="text" id="accounts-dir" readOnly placeholder={accountsDirPlhd} value={accountsDirValue} />
                        <button id="change-accounts-dir" onClick={changeAccountsDir}>{changeAccDirText}</button>
                    </div>

                    <div id="app-language" style={{ display: "none" }} className="settings-content">
                        <h3 id="app-language-title">{appLangTitle}</h3>
                        <ul id="language-list">
                            <input type="radio" name="language-option" id="en-us" value="en-US" className="lang-option" checked={updateLangSet === "en-US"}
                            onChange={() => {
                                setUpdateLangSet("en-US")
                            }} />
                            <label htmlFor="en-us">English</label>
                            <input type="radio" name="language-option" id="pt-br" value="pt-BR" className="lang-option" checked={updateLangSet === "pt-BR"}
                            onChange={() => {
                                setUpdateLangSet("pt-BR")
                            }}
                            />
                            <label htmlFor="pt-br">Português Brasil</label>
                        </ul>

                        <button
                            id="update-language"
                            onClick={() => {
                                changeLanguage(updateLangSet)
                            }}
                        >{updateLangText}</button>
                    </div>

                    <div id="create-text-file-div">
                        <h3 id="create-text-file-title">
                            {createTextFileTitle}
                        </h3>
                        <p id="create-text-file-explanation">
                            {textFileExplanation}
                        </p>
                        <div id="creation-area">
                            <button id="create-text-file"
                             onClick={ () => { createTextFile() } }>{selectFolderText}</button>
                            <p id="created-confirmation" ref={createdConfirmation} style={{ display: "none" }}>{fileCreatedText} <a href="#">{textFilePath}</a></p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

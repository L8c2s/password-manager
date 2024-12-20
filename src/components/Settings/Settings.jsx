import { React, useEffect, useRef, useState } from "react";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { appDataDir } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

import { saveAccounts } from "../Config/accountsManager/manager";
import { loadLangFile } from "../Config/lang";
import { setKey } from "../Config/config";


export function Settings({ settingsPopup, setSettingsPopup, langFile, setLangFile, accounts, setDisplayRestoreTip, config, setConfig }) {
    const [updateLangSet, setUpdateLangSet] = useState("");
    const [textFilePath, setTextFilePath] = useState("");
    const [textFileDir, setTextFileDir] = useState("");
    const createdConfirmation = useRef(null);

    useEffect(() => {
        setUpdateLangSet(config.lang);
    }, []);

    useEffect(() => {
        if (updateLangSet === langFile) return;

        setKey("lang", updateLangSet).then(conf => {
            setConfig(conf);
        });

        setLangFile(loadLangFile(updateLangSet));
    }, [updateLangSet]);

    const generateTextFileContent = async () => {
        const username = langFile.titles.accountInfoUsername;
        const password = langFile.titles.accountInfoPassword;
        const notes = langFile.titles.accountInfoNotes;

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

        return content;
    }

    const createTextFile = async () => {
        let accountsDirPath = await open({
            multiple: false,
            directory: true,
            defaultPath: "$DOCUMENT"
        });

        if (!accountsDirPath) return;

        setTextFileDir(accountsDirPath);
        const filePath = accountsDirPath + "\\accounts.txt";
        setTextFilePath(filePath);

        const textFileContent = await generateTextFileContent();

        try {
            await writeTextFile(encodeURI(filePath), textFileContent);
            createdConfirmation.current.style.display = "block";
        } catch (error) {
            console.log("Could not create the file: ", error)
        }
    }

    const loadFromDirectory = async (directory) => {
        let backupFilePath = await open({
            multiple: false,
            directory: false,
            defaultPath: directory
        });

        let fileData = await readTextFile(backupFilePath);

        await saveAccounts(fileData, true);
        location.reload();
    }

    const openDirectory = async (directory) => {
        await invoke("open_folder", { directory: directory });
    }

    // ------------------------------ //

    const [title, setTitle] = useState("");
    const [appLangTitle, setAppLangTitle] = useState("");
    const [createTextFileTitle, setCreateTextFileTitle] = useState("");
    const [fileCreatedText, setFileCreatedText] = useState("");
    const [textFileExplanation, setTextFileExplanation] = useState("");
    const [openBackupFolderTitle, setOpenBackupFolderTitle] = useState("");
    const [openBackupFolderExpl, setOpenBackupFolderExpl] = useState("");

    useEffect(() => {
        setTitle(langFile.titles.settings);
        setAppLangTitle(langFile.messages.appLanguage);
        setCreateTextFileTitle(langFile.titles.createTextFile);
        setFileCreatedText(langFile.messages.textFileCreated);
        setTextFileExplanation(langFile.messages.createTextFileExplanation);
        setOpenBackupFolderTitle(langFile.titles.openBackupFolder);
        setOpenBackupFolderExpl(langFile.messages.openBackupFolderExplanation);
    }, [langFile]);

    useEffect(() => {
        const on = () => {
            let settingsFullWindow = document.getElementById("settings-div");
            if (!settingsFullWindow) return;
            settingsFullWindow.style.display = "flex";
            setDisplayRestoreTip(false);
        }

        let disableSettings;
        const off = () => {
            let settingsFullWindow = document.getElementById("settings-div");
            if (!settingsFullWindow) return;
            disableSettings = setTimeout(() => settingsFullWindow.style.display = "none", 500);
            if (!createdConfirmation.current) return;
            createdConfirmation.current.style.display = "none";
        }

        if (settingsPopup) {
            on()
        } else {
            off()
        }

        return () => clearTimeout(disableSettings);
    }, [settingsPopup])

    return (
        <div id="settings-div" className={ settingsPopup ? "zoom-in" : "zoom-out" }>
            <div id="settings-blur" onClick={ () => setSettingsPopup(false) }></div>

            <div id="settings-window">
                <div id="settings-window-align">
                    <div id="settings-header-div">
                        <div id="settings-header-align">
                            <h1 id="settings-title">{title}</h1>
                        </div>
                    </div>

                    <div id="settings-content-div">
                        <div id="settings-content-align">

                            <div id="change-app-language-div" className="settings-content-item">
                                <div id="change-app-language-align">
                                    <div id="change-app-language-title-div">
                                        <h2 id="change-app-language-title">{appLangTitle}</h2>
                                    </div>

                                    <div id="change-app-language-content-div">
                                        <div id="change-app-language-content-align">
                                            <div id="brazil-portuguese-language" className="change-language-button">
                                                <input type="text" id="br-language" value="Português Brasil" readOnly className="language-display" />

                                                <button id="brazil-language-select-box" className={"language-select-box" && updateLangSet === "pt-BR" ? "selected-box" : "unselected-box"} onClick={ () => setUpdateLangSet("pt-BR") }></button>
                                            </div>

                                            <div id="english-language" className="change-language-button">
                                                <input type="text" id="en-language" value="English" readOnly className="language-display" />

                                                <button id="english-language-select-box" className={"language-select-box" && updateLangSet === "en-US" ? "selected-box" : "unselected-box"} onClick={ () => setUpdateLangSet("en-US") }></button>
                                            </div>
                                        </div>
                                    </div>                                    
                                </div>
                            </div>

                            <div id="accounts-recovery-div" className="settings-content-item">
                                <div id="accounts-recovery-align">
                                    <div id="recovery-title-div">
                                        <h2 id="recovery-title">{openBackupFolderTitle}</h2>
                                    </div>

                                    <div id="recovery-content-div">
                                        <div id="recovery-content-align">
                                            <div id="recovery-explanation-div">
                                                <p id="recovery-explanation" className="explanation-paragraph">
                                                    {openBackupFolderExpl}
                                                </p>
                                            </div>

                                            <div id="recovery-button-div">
                                                <button id="recovery-button" onClick={
                                                    async () => await loadFromDirectory(`${await appDataDir()}\\backup`)
                                                }></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div id="create-text-file-div" className="settings-content-item">
                                <div id="create-text-file-align">
                                    <div id="create-text-file-title-div">
                                        <h2 id="create-text-file-title" className="explanation-paragraph">{createTextFileTitle}</h2>
                                    </div>

                                    <div id="create-text-file-content-div">
                                        <div id="create-text-file-content-align">
                                            <div id="create-text-content-div">
                                                <p id="create-text-file-explanation">
                                                    {textFileExplanation}
                                                </p>

                                            </div>

                                            <div id="create-text-file-button-div">
                                                <button id="create-text-file-button" onClick={ () => createTextFile() }></button>
                                            </div>
                                        </div>
                                    </div>

                                    <div id="confirmation-div">
                                        <p id="created-confirmation" ref={createdConfirmation} style={{ display: "none" }}>{fileCreatedText} <a href="#" onClick={ async () => await openDirectory(textFileDir) }>{textFilePath}</a></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

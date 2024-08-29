import { React, useEffect, useMemo, useState } from "react";
import { open } from "@tauri-apps/api/dialog";
import "./Settings.css";

import { getConfigValue, loadConfig, saveConfig } from "../Config/config";
import { getMsgLang } from "../Config/lang";


export function Settings({ settingsPopup, setSettingsPopup }) {
    const [langSet, setLangSet] = useState("");
    const [updateLangSet, setUpdateLangSet] = useState("");
    const [accountsDirValue, setAccountsDirValue] = useState("");
    const [monthsToUpdateValue, setMonthsToUpdateValue] = useState(0);

    useEffect(() => {
        const loadLang = async () => {
            setLangSet(await getConfigValue("lang"));
        }

        const loadAccountsDir = async () => {
            let dir = await getConfigValue("accounts_dir");
            let dirValue = "";

            if (dir && dir !== "") {
                dirValue = dir.split("\\");
                dirValue = `${dirValue[dirValue.length-2]}\\${dirValue[dirValue.length-1]}`;
            }

            setAccountsDirValue(dirValue);
        }

        loadLang();
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

        let config = await loadConfig();
        config["accounts_dir"] = accountsDirPath
        await saveConfig(config);
        location.reload();
    }

    const changeLanguage = async (language) => {
        if (language === langSet)
            return null;

        let config = await loadConfig();
        config["lang"] = language;
        await saveConfig(config);
        location.reload();
    }

    // ------------------------------ //

    const [title, setTitle] = useState("");
    const [changeAccDirText, setChangeAccDirText] = useState("");
    const [accountsDirPlhd, setAccountsDirPlhd] = useState("");
    const [monthsToUpdatePassTitle, setMonthsToUpdatePassTitle] = useState("");
    const [accountsDirTitle, setChangeAccDirTitle] = useState("");
    const [appLangTitle, setAppLangTitle] = useState("");
    const [updateLangText, setUpdateLangText] = useState("");

    useEffect(() => {
        const update = async () => {
            setTitle(await getMsgLang(langSet, "Settings", ".title"));
            setAccountsDirPlhd(await getMsgLang(langSet, "Settings", "accounts-dir.placeholder"))
            setChangeAccDirText(await getMsgLang(langSet, "Settings", "change-accounts-dir.text"));
            setMonthsToUpdatePassTitle(await getMsgLang(langSet, "Settings", "months-to-update-pass.title"));
            setChangeAccDirTitle(await getMsgLang(langSet, "Settings", "change-accounts-dir.title"));
            setAppLangTitle(await getMsgLang(langSet, "Settings", "app-language-title.title"));
            setUpdateLangText(await getMsgLang(langSet, "Settings", "update-language.text"));
        }

        update();
        setUpdateLangSet(langSet);
    }, [langSet]);

    // ------------------------------ //

    useEffect(() => {
        const on = () => {
            let settings_full_window = document.getElementById("settings-full-window");
            settings_full_window.style.display = "block";
            settings_full_window.className = "zoom-in";
        }

        const off = () => {
            let settings_full_window = document.getElementById("settings-full-window");
            settings_full_window.className = "zoom-out";
            settings_full_window.style.display = "none";
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

                    <div id="app-language" className="settings-content">
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

                    {/* <div id="months-notification" className="settings-content">
                        <h3 id="months-notification-title">{monthsToUpdateTitle}</h3>
                        <p id="months-to-update-pass">
                            Notify me in <input type="text" id="months-update-pass" readOnly value={monthsToUpdateValue} /> months
                        </p>
                        <input type="range" max={6} min={0} id="months-to-update-number" onChange={(e) => {setMonthsToUpdateValue(e.target.value)}} />
                    </div> */}

                </div>
            </div>
        </div>
    );
}

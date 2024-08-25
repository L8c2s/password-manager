import { React, useState, useEffect } from "react";
import "./Header.css"

import { getConfigValue } from "../Config/config";
import { getMsgLang } from "../Config/lang";


export function Header({ searchTerm, setSearchTerm, settingsPopup, setSettingsPopup }) {
    const [langSet, setLangSet] = useState("");

    useEffect(() => {
        const loadLang = async () => {
            let langSaved = await getConfigValue("lang");
            setLangSet(langSaved);
        }

        loadLang();
    }, []);

    useEffect(() => {
        const updateSearchPlHd = async () => {
            let placeholder = await getMsgLang(langSet, "Header", "search.placeholder");
            document.getElementById("search-bar").setAttribute("placeholder", placeholder);
        }

        updateSearchPlHd();
    }, [langSet])

    return (
        <div id="header">
            <div id="search">
                <input
                    type="text"
                    id="search-bar"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value) }}
                    autoFocus="autofocus"
                />
                <button id="clear-search-bar"
                    onClick={() => { setSearchTerm("") }}
                ></button>
            </div>

            <div id="utils">
                <button id="open-settings"
                    onClick={() => { setSettingsPopup(!settingsPopup) }}
                ></button>
            </div>
        </div>
    );
}

export default Header;

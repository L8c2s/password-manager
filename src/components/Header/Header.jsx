import { React, useEffect, useRef, useState } from "react";
import "./Header.css"

import { getMsg } from "../Config/lang";


export function Header({ langFile, searchTerm, setSearchTerm, settingsPopup, setSettingsPopup, setAddAccount, setEditAccount, displayRestoreTip }) {
    const searchRef = useRef(null);

    const [placeholder, setPlaceholder] = useState("");
    const [restoreTip, setRestoreTip] = useState("");

    // set the text using the current language
    useEffect(() => {
        setPlaceholder(getMsg(langFile, "Header", "search.placeholder"));
        setRestoreTip(getMsg(langFile, "Settings", "recover.tip"));
    }, [langFile]);

    useEffect(() => {
        window.addEventListener("keydown", startSearch);
        return () => window.removeEventListener("keydown", startSearch);
    }, []);

    const startSearch = (event) => {
        if (event.key === "/") {
            if (!searchRef.current.focused) {
                event.preventDefault();
            }
            searchRef.current.focus();
        } else if (event.key === "Escape") {
            searchRef.current.blur();
            setSettingsPopup(false);
            setAddAccount(false);
            setEditAccount(false);
        }
    };

    return (
        <div id="header">
            <div id="search">
                <input
                    type="text"
                    id="search-bar"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value) }}
                    autoFocus
                    ref={searchRef}
                    autoComplete="off"
                    placeholder={placeholder}
                />
                <button id="clear-search-bar"
                    onClick={() => { setSearchTerm("") }}
                ></button>
            </div>

            <div id="utils">
                <div id="display-restore-tip">
                    {displayRestoreTip === true ? <p id="restore-tip">{restoreTip}</p> : null}
                </div>

                <button id="open-settings"
                    onClick={() => { setSettingsPopup(true) }}
                ></button>
            </div>
        </div>
    );
}

export default Header;

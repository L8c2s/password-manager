import { React, useEffect, useRef, useState } from "react";
import "./Header.css"

import { getMsg } from "../Config/lang";


export function Header({ langFile, searchTerm, setSearchTerm, settingsPopup, setSettingsPopup, setAddAccount, setEditAccount }) {
    const searchRef = useRef(null);

    const [placeholder, setPlaceholder] = useState("");

    useEffect(() => {
        setPlaceholder(getMsg(langFile, "Header", "search.placeholder"));
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
                <button id="open-settings"
                    onClick={() => { setSettingsPopup(true) }}
                ></button>
            </div>
        </div>
    );
}

export default Header;

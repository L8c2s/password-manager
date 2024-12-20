import { React, useEffect, useRef, useState } from "react";


export function Header({ langFile, searchTerm, setSearchTerm, setSettingsPopup, setAddAccount, setEditAccount }) {
    const searchRef = useRef(null);

    const [searchPlhd, setSearchPlhd] = useState("");

    useEffect(() => {
        setSearchPlhd(langFile.placeholders.search);
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
            <div id="search-div">
                <input type="text" id="search-bar" value={searchTerm} onChange={ e => {
                    setSearchTerm(e.target.value)
                } } autoFocus ref={searchRef} autoComplete="off" placeholder={searchPlhd} />

                <button id="clear-search-bar" onClick={ () => {
                    setSearchTerm("");
                } }></button>
            </div>

            <div id="utils-div">
                <button id="open-settings" onClick={() => {
                    setSettingsPopup(true);
                }}></button>
            </div>
        </div>
    );
}

export default Header;

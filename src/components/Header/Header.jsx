import { React, useState, useEffect } from "react";
import "./Header.css"

import { getConfigValue } from "../Config/config";
import { getMsgLang } from "../Config/lang";


export function Header({ searchTerm, setSearchTerm }) {
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
                />
            </div>
        </div>
    );
}

export default Header;

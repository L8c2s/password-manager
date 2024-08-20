import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";

// components
import { Header } from "./components/Header/Header";
import { UpdateList } from "./components/AccountsList/AccountsList";

// configurations
import { getConfigValue } from "./components/Config/config";
import { getMsgLang } from "./components/Config/lang";


function App() {
    const [langSet, setLangSet] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const loadLang = async () => {
            let langSaved = await getConfigValue("lang");
            setLangSet(langSaved);
        }

        loadLang();
    }, []);

    useEffect(() => {
        
    }, [langSet])

    return (
        <div id="content">
            <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <UpdateList searchTerm={searchTerm} />
        </div>
    );
}

export default App;

import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";

// components
import { Header } from "./components/Header/Header";
import { UpdateList } from "./components/AccountsList/AccountsList";
import { Settings } from "./components/Settings/Settings";
import { AccountsInfo } from "./components/AccountInfo/AccountInfo";

// configurations
import { getConfigValue } from "./components/Config/config";
import { getMsgLang } from "./components/Config/lang";


function App() {
    const [langSet, setLangSet] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [settingsPopup, setSettingsPopup] = useState(false);
    const [showAccountInfo, setShowAccountInfo] = useState(false);
    const [selectedId, setSelectedId] = useState("");

    useEffect(() => {
        const loadLang = async () => {
            let langSaved = await getConfigValue("lang");
            setLangSet(langSaved);
        }

        loadLang();
    }, []);

    useEffect(() => {
        if (settingsPopup) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    });

    return (
        <div id="content">
            <Header
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                settingsPopup={settingsPopup} setSettingsPopup={setSettingsPopup}
            />
            <UpdateList searchTerm={searchTerm} setShowAccountInfo={setShowAccountInfo} selectedId={selectedId} setSelectedId={setSelectedId} />
            <AccountsInfo showAccountInfo={showAccountInfo} setShowAccountInfo={setShowAccountInfo} selectedId={selectedId} setSelectedId={setSelectedId} />
            <Settings settingsPopup={settingsPopup} setSettingsPopup={setSettingsPopup} />
        </div>
    );
}

export default App;

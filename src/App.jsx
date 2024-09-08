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
import { getAccounts } from "./components/Config/accountsManager/manager";


function App() {
    const [langSet, setLangSet] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [settingsPopup, setSettingsPopup] = useState(false);
    const [showAccountInfo, setShowAccountInfo] = useState(false);
    const [selectedId, setSelectedId] = useState("");
    const [accounts, setAccounts] = useState({});
    const [favorite, setFavorite] = useState([]);
    const [updatedFavorite, setUpdatedFavorite] = useState(false);

    useEffect(() => {
        const loadLang = async () => {
            let langSaved = await getConfigValue("lang");
            setLangSet(langSaved);
        }

        const loadAccounts = async () => {
            setAccounts(await getAccounts());
        }

        loadLang();
        loadAccounts();
    }, []);

    useEffect(() => {
        if (settingsPopup) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    }, [settingsPopup]);

    return (
        <div id="content">
            <Header
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                settingsPopup={settingsPopup} setSettingsPopup={setSettingsPopup}
            />

            <UpdateList 
                accounts={accounts} setAccounts={setAccounts}
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                showAccountInfo={showAccountInfo} setShowAccountInfo={setShowAccountInfo}
                selectedId={selectedId} setSelectedId={setSelectedId}
                favorite={favorite} setFavorite={setFavorite}
            />

            <AccountsInfo
                accounts={accounts} setAccounts={setAccounts}
                showAccountInfo={showAccountInfo} setShowAccountInfo={setShowAccountInfo}
                selectedId={selectedId} setSelectedId={setSelectedId}
                favorite={favorite} setFavorite={setFavorite}
                setSearchTerm={setSearchTerm}
            />

            <Settings
                settingsPopup={settingsPopup} setSettingsPopup={setSettingsPopup}
            />
        </div>
    );
}

export default App;

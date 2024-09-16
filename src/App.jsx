import { useState, useEffect } from "react";
import "./App.css";

// components
import { Header } from "./components/Header/Header";
import { UpdateList } from "./components/AccountsList/AccountsList";
import { Settings } from "./components/Settings/Settings";
import { AccountsInfo } from "./components/AccountInfo/AccountInfo";
import { AddEditAccount } from "./components/AddEditAccount/AddEditAccount";

// configurations
import { getConfigValue } from "./components/Config/config";
import { getAccounts } from "./components/Config/accountsManager/manager";


function App() {
    const [langSet, setLangSet] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [settingsPopup, setSettingsPopup] = useState(false);
    const [showAccountInfo, setShowAccountInfo] = useState(false);
    const [selectedId, setSelectedId] = useState("");
    const [accounts, setAccounts] = useState({});
    const [favorite, setFavorite] = useState([]);
    const [addAccount, setAddAccount] = useState(false);
    const [editAccount, setEditAccount] = useState(false);

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
        if (settingsPopup || addAccount || editAccount) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    }, [settingsPopup, addAccount, editAccount]);

    return (
        <div id="content">
            <Header
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                settingsPopup={settingsPopup} setSettingsPopup={setSettingsPopup}
                langSet={langSet}
                setAddAccount={setAddAccount} setEditAccount={setEditAccount}
            />

            <UpdateList 
                accounts={accounts} setAccounts={setAccounts}
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                showAccountInfo={showAccountInfo} setShowAccountInfo={setShowAccountInfo}
                selectedId={selectedId} setSelectedId={setSelectedId}
                favorite={favorite} setFavorite={setFavorite}
                langSet={langSet}
            />

            <AccountsInfo
                accounts={accounts} setAccounts={setAccounts}
                showAccountInfo={showAccountInfo} setShowAccountInfo={setShowAccountInfo}
                selectedId={selectedId} setSelectedId={setSelectedId}
                favorite={favorite} setFavorite={setFavorite}
                setSearchTerm={setSearchTerm}
                editAccount={editAccount} setEditAccount={setEditAccount}
                langSet={langSet}
            />

            <Settings
                settingsPopup={settingsPopup} setSettingsPopup={setSettingsPopup}
                langSet={langSet} setLangSet={langSet}
            />

            <AddEditAccount 
                accounts={accounts} setAccounts={setAccounts}
                addAccount={addAccount} setAddAccount={setAddAccount}
                editAccount={editAccount} setEditAccount={setEditAccount}
                selectedId={selectedId}
                setShowAccountInfo={setShowAccountInfo}
                langSet={langSet}
            />
        </div>
    );
}

export default App;

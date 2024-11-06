import { useState, useEffect } from "react";
import "./App.css";

// components
import { Login } from "./components/Login/Login";
import { Header } from "./components/Header/Header";
import { UpdateList } from "./components/AccountsList/AccountsList";
import { Settings } from "./components/Settings/Settings";
import { AccountsInfo } from "./components/AccountInfo/AccountInfo";
import { AddEditAccount } from "./components/AddEditAccount/AddEditAccount";

// configurations
import { getConfigValue } from "./components/Config/config";
import { getAccounts } from "./components/Config/accountsManager/manager";
import { loadLangFile } from "./components/Config/lang";


function App() {
    const [langFile, setLangFile] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [settingsPopup, setSettingsPopup] = useState(false);
    const [showAccountInfo, setShowAccountInfo] = useState(false);
    const [selectedId, setSelectedId] = useState("");
    const [accounts, setAccounts] = useState({});
    const [favorite, setFavorite] = useState([]);
    const [addAccount, setAddAccount] = useState(false);
    const [editAccount, setEditAccount] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(true);

    useEffect(() => {
        const loadLang = async () => {
            let langSaved = await getConfigValue("lang");
            setLangFile(loadLangFile(langSaved));
        }

        const loadAccounts = async () => {
            setAccounts(await getAccounts());
        }

        loadLang();
        loadAccounts();

        let getHeightTimeout = setTimeout(() => console.log("Window Height: ", window.innerHeight), 5000)
        let getWidthTimeout = setTimeout(() => console.log("Window Width: ", window.innerWidth), 5000)

        return () => {
            clearTimeout(getHeightTimeout);
            clearTimeout(getWidthTimeout);
        }
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
            { !loginSuccess && (<Login langFile={langFile} setLoginSuccess={setLoginSuccess} />) }

            { loginSuccess && (
                <div>
                    <Header
                        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                        settingsPopup={settingsPopup} setSettingsPopup={setSettingsPopup}
                        langFile={langFile}
                        setAddAccount={setAddAccount} setEditAccount={setEditAccount}
                    />

                    <UpdateList 
                        accounts={accounts} setAccounts={setAccounts}
                        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                        showAccountInfo={showAccountInfo} setShowAccountInfo={setShowAccountInfo}
                        selectedId={selectedId} setSelectedId={setSelectedId}
                        favorite={favorite} setFavorite={setFavorite}
                        langFile={langFile}
                    />

                    <AccountsInfo
                        accounts={accounts} setAccounts={setAccounts}
                        showAccountInfo={showAccountInfo} setShowAccountInfo={setShowAccountInfo}
                        selectedId={selectedId} setSelectedId={setSelectedId}
                        favorite={favorite} setFavorite={setFavorite}
                        setSearchTerm={setSearchTerm}
                        editAccount={editAccount} setEditAccount={setEditAccount}
                        langFile={langFile}
                    />

                    <Settings
                        settingsPopup={settingsPopup} setSettingsPopup={setSettingsPopup}
                        langFile={langFile} setLangFile={langFile}
                        accounts={accounts}
                    />

                    <AddEditAccount 
                        accounts={accounts} setAccounts={setAccounts}
                        addAccount={addAccount} setAddAccount={setAddAccount}
                        editAccount={editAccount} setEditAccount={setEditAccount}
                        selectedId={selectedId}
                        setShowAccountInfo={setShowAccountInfo}
                        langFile={langFile}
                    />
                </div>
            )}
        </div>
    );
}

export default App;

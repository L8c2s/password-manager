import { useState, useEffect } from "react";
import "./App.css";

// components
import { Login } from "./components/Login/Login";
import { Header } from "./components/Header/Header";
import { Settings } from "./components/Settings/Settings";
import { UpdateList } from "./components/AccountsList/AccountsList";
import { AccountsInfo } from "./components/AccountInfo/AccountInfo";
import { History } from "./components/PasswordHistory/PasswordHistory";
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
    const [loginSuccess, setLoginSuccess] = useState(false);
    const [displayHistory, setDisplayHistory] = useState(false);
    const [displayRestoreTip, setDisplayRestoreTip] = useState(false);

    useEffect(() => {
        const loadLang = async () => {
            let langSaved = await getConfigValue("lang");
            setLangFile(loadLangFile(langSaved));
        }

        loadLang();
    }, []);

    useEffect(() => {
        if (!loginSuccess) {
            return;
        }

        const loadAccounts = async () => {
            setAccounts(await getAccounts());
        }

        loadAccounts();
    }, [loginSuccess]);

    useEffect(() => {
        if (settingsPopup || addAccount || editAccount || displayHistory) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    }, [settingsPopup, addAccount, editAccount, displayHistory]);

    // window.addEventListener("resize", logWindowSize);

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
                        displayRestoreTip={displayRestoreTip}
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
                        setDisplayHistory={setDisplayHistory}
                    />

                    <History
                        langFile={langFile}
                        accounts={accounts}
                        displayHistory={displayHistory} setDisplayHistory={setDisplayHistory}
                        selectedId={selectedId}
                    />

                    <Settings
                        settingsPopup={settingsPopup} setSettingsPopup={setSettingsPopup}
                        langFile={langFile} setLangFile={langFile}
                        accounts={accounts}
                        setDisplayRestoreTip={setDisplayRestoreTip}
                    />

                    <AddEditAccount 
                        accounts={accounts} setAccounts={setAccounts}
                        addAccount={addAccount} setAddAccount={setAddAccount}
                        editAccount={editAccount} setEditAccount={setEditAccount}
                        selectedId={selectedId}
                        setShowAccountInfo={setShowAccountInfo}
                        langFile={langFile}
                        setDisplayRestoreTip={setDisplayRestoreTip}
                    />
                </div>
            )}
        </div>
    );
}

export default App;

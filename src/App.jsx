import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";
import "./App.css";
import "./components/Login/Login.css";
import "./components/Header/Header.css";
import "./components/AccountsList/AccountsList.css";
import "./components/notification/notification.css";
import "./components/AccountInfo/AccountInfo.css";
import "./components/PasswordHistory/PasswordHistory.css";
import "./components/FloatingArea/FloatingArea.css";
import "./components/AddEditAccount/AddEditAccount.css";
import "./components/Settings/Settings.css";
import "./max-size.css";

// components
import { AddEditAccount } from "./components/AddEditAccount/AddEditAccount";
import { History } from "./components/PasswordHistory/PasswordHistory";
import { FloatingArea } from "./components/FloatingArea/FloatingArea";
import { AccountsInfo } from "./components/AccountInfo/AccountInfo";
import { UpdateList } from "./components/AccountsList/AccountsList";
import { Settings } from "./components/Settings/Settings";
import { Header } from "./components/Header/Header";
import { Login } from "./components/Login/Login";

// configurations
import { loadAccounts } from "./components/Config/accountsManager/manager";
import { loadConfig } from "./components/Config/config";
import { loadLangFile } from "./components/Config/lang";

function App() {
    const [afterEditAccount, setAfterEditAccount] = useState(false);
    const [showAccountInfo, setShowAccountInfo] = useState(false);
    const [displayHistory, setDisplayHistory] = useState(false);
    const [settingsPopup, setSettingsPopup] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);
    const [editAccount, setEditAccount] = useState(false);
    const [addAccount, setAddAccount] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedId, setSelectedId] = useState("");
    const [langFile, setLangFile] = useState("");
    const [accounts, setAccounts] = useState({});
    const [favorite, setFavorite] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [config, setConfig] = useState({});

    useEffect(() => {
        loadConfig().then(conf => {
            setConfig(conf);
            setLangFile(loadLangFile(conf.lang));
        });

        window.addEventListener("keydown", addAccountShortcut);
        return () => window.removeEventListener("keydown", addAccountShortcut);
    }, []);

    useEffect(() => {
        if (!loginSuccess) return;
        loadAccounts().then(accs => setAccounts(accs));

        // invoke("test_derivation");
        // invoke("encryption_test", { testString: "test" });
        // invoke("decryption_test", { testString: "test" });
    }, [loginSuccess]);

    // check if all resources are loaded
    useEffect(() => {
        if (config, langFile)
            setLoaded(true);
        else
            setLoaded(false);
    }, [config, langFile]);

    useEffect(() => {
        if (settingsPopup || addAccount || editAccount || displayHistory) {
            document.body.style.overflowY = "hidden";
        } else {
            document.body.style.overflowY = "auto";
        }
    }, [settingsPopup, addAccount, editAccount, displayHistory]);

    const addAccountShortcut = (event) => {
        if (event.ctrlKey && (event.key === "n" || event.key === "N")) {
            setAddAccount(true);
        }
    }

    return loaded ? (
        <div id="content">
            { !loginSuccess && (<Login langFile={langFile} setLoginSuccess={setLoginSuccess} config={config} setConfig={setConfig} />) }

            { loginSuccess && (
                <div id="main-content">
                    <Header
                        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                        settingsPopup={settingsPopup} setSettingsPopup={setSettingsPopup}
                        langFile={langFile}
                        setAddAccount={setAddAccount} setEditAccount={setEditAccount}
                        displayRestoreTip={afterEditAccount}
                        config={config} setConfig={setConfig}
                    />

                    <div id="manager-content">
                        <UpdateList 
                            accounts={accounts} setAccounts={setAccounts}
                            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                            showAccountInfo={showAccountInfo} setShowAccountInfo={setShowAccountInfo}
                            selectedId={selectedId} setSelectedId={setSelectedId}
                            favorite={favorite} setFavorite={setFavorite}
                            langFile={langFile}
                            config={config} setConfig={setConfig}
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
                            config={config} setConfig={setConfig}
                        />
                    </div>

                    <History
                        langFile={langFile}
                        accounts={accounts}
                        displayHistory={displayHistory} setDisplayHistory={setDisplayHistory}
                        selectedId={selectedId}
                        config={config} setConfig={setConfig}
                    />

                    <Settings
                        settingsPopup={settingsPopup} setSettingsPopup={setSettingsPopup}
                        langFile={langFile} setLangFile={langFile}
                        accounts={accounts}
                        setDisplayRestoreTip={setAfterEditAccount}
                        config={config} setConfig={setConfig}
                    />

                    <AddEditAccount 
                        accounts={accounts} setAccounts={setAccounts}
                        addAccount={addAccount} setAddAccount={setAddAccount}
                        editAccount={editAccount} setEditAccount={setEditAccount}
                        selectedId={selectedId}
                        setShowAccountInfo={setShowAccountInfo}
                        langFile={langFile}
                        setDisplayRestoreTip={setAfterEditAccount}
                        config={config} setConfig={setConfig}
                    />

                    <FloatingArea setAddAccount={setAddAccount} afterEditAccount={afterEditAccount} setSettingsPopup={setSettingsPopup} />
                </div>
            )}
        </div>
    ) : null;
}

export default App;

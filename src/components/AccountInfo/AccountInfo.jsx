import { React, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";


import { editAccountKey, getAccount, loadAccounts, saveAccounts } from "../Config/accountsManager/manager";

import { Notification } from "../notification/notification";


export function AccountsInfo({ langFile, accounts, setAccounts, selectedId, setSelectedId, favorite, setFavorite, setEditAccount, setDisplayHistory, showAccountInfo, setShowAccountInfo }) {
    const [account, setAccount] = useState({});
    const [displayHistoryTip, setDisplayHistoryTip] = useState(false);
    const passwordInput = useRef(null);

    useEffect(() => {        
        if (!showAccountInfo || !selectedId) {
            setAccount({});
            setSelectedId("");
            setShowAccountInfo(false);
            return;
        }

        setAccount(getAccount(accounts, selectedId));
    }, [showAccountInfo, selectedId]);

    useEffect(() => {
        if (!account || !account.password) return;
        decryptPassword(account.password).then(password => passwordInput.current.value = password);
    }, [account]);

    const getDisplayable = (createdDate) => {
        if (!createdDate) return;

        let [date, time] = createdDate.split("T");

        let [year, month, day] = date.split("-");
        date = `${day}/${month}/${year}`;

        return `${date} ${time.split(".")[0]}`;
    }

    useEffect(() => {
        const updateFavorite = async () => {
            if (favorite[1] !== account.favorite) {
                setAccounts(await editAccountKey(accounts, null, "favorite", favorite[1], account));
            }
        }

        if (!favorite[0]) return;

        // change the favorite icon
        if (selectedId === favorite[0]) {
            const favoriteButton = document.getElementById("favorite-button");
            if (favorite[1]) {
                favoriteButton.className = "favorite";
            } else {
                favoriteButton.className = "not-favorite";
            }
        }

        updateFavorite();
    }, [favorite]);

    const decryptPassword = async (password) => {
        let decrypted = await invoke("decrypt_password", { encryptedPassword: password });

        if (!decrypted) {
            return;
        }

        return decrypted;
    }

    const deleteAccount = async (accountId) => {
        let accountIndex = -1;
        // gets the account index in the accounts object, removes it from the list and apply the changes
        for (const service in accounts) {
            for (let i = 0; i < accounts[service].length; i++) {
                if (accounts[service][i].id === accountId)
                    accountIndex = i;
            }
        }

        if (accountIndex === -1) {
            await window.alert(langFile.messages.deleteAccountError);
            return;
        }

        const confirmation = await window.confirm(confirmDeleteMsg);
        if (!confirmation) return;

        let newAccounts = {...accounts};
        newAccounts[account.service].splice(accountIndex, 1);
        await saveAccounts(newAccounts);
        setAccounts(await loadAccounts());

        setShowAccountInfo(false);
        setSelectedId("");
    };

    const [confirmDeleteMsg, setConfirmDeleteMsg] = useState("");
    const [serviceTitle, setServiceTitle] = useState("");
    const [usernameTitle, setUsernameTitle] = useState("");
    const [passwordTitle, setPasswordTitle] = useState("");
    const [notesTitle, setNotesTitle] = useState("");
    const [lastModifiedText, setLastModifiedText] = useState("");
    const [createdText, setCreatedText] = useState("");
    const [passwordHistoryTitle, setPasswordHistoryTitle] = useState("");

    useEffect(() => {
        setServiceTitle(langFile.titles.accountInfoService);
        setUsernameTitle(langFile.titles.accountInfoUsername);
        setPasswordTitle(langFile.titles.accountInfoPassword);
        setNotesTitle(langFile.titles.accountInfoNotes);
        setLastModifiedText(langFile.titles.accountInfoLastModified);
        setCreatedText(langFile.titles.accountInfoCreated);
        setConfirmDeleteMsg(langFile.titles.accountDeleteConfirm);
        setPasswordHistoryTitle(langFile.titles.passwordHistory);
    }, [langFile]);

    const copyString = (string) => {
        navigator.clipboard.writeText(string);
    }

    const copyElementValue = (elementId) => {
        const element = document.getElementById(elementId);
        if (!element.value) return false;

        copyString(element.value);
    }

    const [passwordTimeout, setPasswordTimeout] = useState();

    const turnPassVisibility = () => {        
        const password = document.getElementById("account-password-info");
        password.type = "text";
        const showPassBtn = document.getElementById("show-password");
        showPassBtn.setAttribute("disabled", true);
        showPassBtn.classList.remove("no-visibility");
        showPassBtn.classList.add("visibility");

        if (passwordTimeout) {
            clearTimeout(passwordTimeout);
        }

        setPasswordTimeout(setTimeout(() => {
            password.type = "password";
            showPassBtn.removeAttribute("disabled");
            showPassBtn.classList.remove("visibility");
            showPassBtn.classList.add("no-visibility");
        }, 1000));
    }

    useEffect(() => {
        const historyTip = document.getElementById("display-history-tip");
        if (!historyTip) return;

        if (!displayHistoryTip)
            historyTip.className = "hidden";
        else
            historyTip.className = "show";
    }, [displayHistoryTip]);

    return (
        <div id="accounts-info-div" className={showAccountInfo ? "info-on" : "info-off"}>
            <div id="account-info-anim-div">
                {account && (<div id="account-info">
                    <div id="account-info-utils">
                        <div id="info-utils-left">
                            <button id="close-info" onClick={ () => setShowAccountInfo(false) }></button>
                        </div>

                        <div id="info-utils-right">
                            <p id="display-history-tip" className="hidden">{passwordHistoryTitle}</p>
                            <button id="display-password-history" 
                             onClick={ () => { setDisplayHistory(true) } }
                             onMouseOver={ () => setDisplayHistoryTip(true) }
                             onMouseOut={ () => setDisplayHistoryTip(false) }></button>

                             <button id="favorite-button" className={account.favorite ? "favorite" : "not-favorite"} onClick={() => {
                                setFavorite([account.id, !account.favorite]);
                             }}></button>

                            <button id="edit-account" onClick={() => {
                                setEditAccount(true);
                            }}></button>

                            <button id="delete-account" onClick={ () => {
                                deleteAccount(account.id);
                                setSelectedId("");
                            } }></button>
                        </div>
                    </div>

                    <div id="notification-div">
                        <Notification langFile={langFile} accounts={accounts} account={account} notificationId={"account-info-notification"} />
                    </div>

                    <div id="account-info-sec">
                        <div id="account-info-items">
                             <div id="account-info-item-align">
                                <div id="service-info" className="account-info-item">
                                    <div id="service-data"
                                    className="account-data">
                                        <h4 id="service-title" className="account-info-data account-data-title">{serviceTitle}</h4>
                                        <input type="text" id="account-service-info" readOnly placeholder="Account Service" value={account.service ?? ""} className="account-info-data account-data-input" />
                                    </div>
                                </div>

                                <div id="username-info" className="account-info-item">
                                    <div id="username-data" className="account-data">
                                        <h4 id="username-title" className="account-info-data account-data-title">{usernameTitle}</h4>
                                        <input type="text" id="account-username-info" className="account-info-data account-data-input" readOnly placeholder="Account Username" value={account.username ?? ""} />
                                    </div>

                                    <div id="username-utils" className="account-data-utils">
                                        <button id="copy-username" className="copy-button data-utils" onClick={ () => copyElementValue("account-username-info") }></button>
                                    </div>
                                </div>

                                <div id="password-info" className="account-info-item">
                                    <div id="password-data" className="account-data">
                                        <h4 id="password-title" className="account-info-data account-data-title">{passwordTitle}</h4>

                                        <input type="password" id="account-password-info" className="account-info-data account-data-input" readOnly placeholder="Account Password" ref={passwordInput} />
                                    </div>

                                    <div id="password-utils" className="account-data-utils">
                                        <button id="show-password" className="visibility-button no-visibility data-utils" onClick={ () => turnPassVisibility() }></button>

                                        <button id="copy-password" className="copy-button data-utils" onClick={ () => copyElementValue("account-password-info") }></button>
                                    </div>
                                </div>

                                <div id="notes-info" className="account-info-item">
                                    <div id="notes-data" className="account-data">
                                        <h4 id="notes-title" className="account-info-data account-data-title">{notesTitle}</h4>
                                        <input type="text" id="account-notes-info" className="account-info-data account-data-input" readOnly placeholder="Account Notes" value={account.notes ?? ""} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="date-data">
                        <div id="date-info">
                            <p id="created-date" className="account-info-date">{createdText} {getDisplayable(account.created) ?? ""}</p>
                            <p id="last-modified" className="account-info-date">{lastModifiedText} {getDisplayable(account.last_modified) ?? ""}</p>
                        </div>
                    </div>
                </div>)}
            </div>
        </div>
    );
}

export default AccountsInfo;
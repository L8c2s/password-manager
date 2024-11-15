import { React, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./AccountInfo.css";

import { getMsg } from "../Config/lang";
import { editAccountKey, getAccount, getAccounts, saveAccounts } from "../Config/accountsManager/manager";

import { Notification } from "../notification/notification";


export function AccountsInfo({ langFile, accounts, setAccounts, showAccountInfo, setShowAccountInfo, selectedId, setSelectedId, favorite, setFavorite, setEditAccount }) {
    const [account, setAccount] = useState({});
    const [service, setService] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [notes, setNotes] = useState("");
    const [accountLoaded, setAccountLoaded] = useState(false);

    useEffect(() => {
        const infoWindow = document.getElementById("accounts-info-div");
        if (showAccountInfo) {
            infoWindow.className = "info-on";
        } else {
            infoWindow.className = "info-off";
            setAccount({});
        }
    }, [showAccountInfo]);

    useEffect(() => {
        if (!selectedId) return;
        setAccount(getAccount(accounts, selectedId));
    }, [selectedId]);

    // useEffect(() => {
    //     setPassword(account.password);
    //     setAccountLoaded(true);
    // }, [decryptedPassword]);

    useEffect(() => {
        const decrypt = async () => {
            await decryptPassword();
        }
        
        if (!account) return;

        decrypt();

        setFavorite([account.id, account.favorite]);
        setService(account.service);
        setUsername(account.username);
        setNotes(account.notes);

        const lastModified = document.getElementById("last-modified");
        const created = document.getElementById("created-date");

        const getDisplayable = (createdDate) => {
            let [date, time] = createdDate.split("T");

            let [year, month, day] = date.split("-");
            date = `${day}/${month}/${year}`;

            return `${date} ${time.split(".")[0]}`;
        }

        if (account.created) {
            let createdDate = account.created;
            let displayableCreate = "-";

            if (createdDate)
                displayableCreate = getDisplayable(createdDate);

            created.innerHTML = `${createdText} ${displayableCreate}`;
        } if (account.last_modified) {
            let modifiedDate = account.last_modified;
            let displayableModified = "-";

            if (modifiedDate)
                displayableModified = getDisplayable(modifiedDate);

            lastModified.innerHTML = `${lastModifiedText} ${displayableModified}`;
        }
    }, [account]);

    useEffect(() => {
        if (!accountLoaded) return;

        document.getElementById("show-service-info").value = service;
        document.getElementById("show-username-info").value = username;
        document.getElementById("show-password-info").value = password;
        document.getElementById("show-notes-info").value = notes;
        setAccountLoaded(false);
    }, [accountLoaded]);

    useEffect(() => {
        const updateFavorite = async () => {
            const acc = getAccount(accounts, favorite[0]);

            if (favorite[1] !== acc.favorite) {
                setAccounts(await editAccountKey(accounts, favorite[0], "favorite", favorite[1]));                
            }

            // change the favorite icon
            const favoriteButton = document.getElementById("favorite");
            if (favorite[1]) {
                favoriteButton.className = "favorite";
            } else {
                favoriteButton.className = "not-favorite";
            }
        }

        if (!favorite[0]) return;
        updateFavorite();
    }, [favorite]);

    const decryptPassword = async () => {
        if (!account) return;

        console.log("Decrypting: ", account.password);
        let decrypted;
        try {
            decrypted = await invoke("decrypt_password", { encryptedPassword: account.password });
        } catch {}

        if (!decrypted) {
            return;
        }

        setPassword(decrypted);
        setAccountLoaded(true);
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
            await window.alert(getMsg(langFile, "AccountInfo", "delete_account.no_id"));
            return;
        }

        const confirmation = await window.confirm(confirmDeleteMsg);
        if (!confirmation) return;

        let newAccounts = accounts;
        newAccounts[service].splice(accountIndex, 1);
        await saveAccounts(newAccounts);
        setAccounts(await getAccounts());

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

    useEffect(() => {
        const setLangMsg = async () => {
            setServiceTitle(getMsg(langFile, "AccountInfo", "service.title"));
            setUsernameTitle(getMsg(langFile, "AccountInfo", "username.title"));
            setPasswordTitle(getMsg(langFile, "AccountInfo", "password.title"));
            setNotesTitle(getMsg(langFile, "AccountInfo", "notes.title"));
            setLastModifiedText(getMsg(langFile, "AccountInfo", "additional-info.last_modified"));
            setCreatedText(getMsg(langFile, "AccountInfo", "additional-info.created"));
            setConfirmDeleteMsg(getMsg(langFile, "AccountInfo", "delete_account.confirmation"));
        }

        setLangMsg();
    }, [langFile]);

    const copy = (elementId) => {
        const element = document.getElementById(elementId);
        if (!element.value) return false;

        navigator.clipboard.writeText(element.value);
    }

    const [passwordTimeout, setPasswordTimeout] = useState();

    const turnPassVisibility = () => {        
        const password = document.getElementById("show-password-info");
        password.type = "text";
        const showPassBtn = document.getElementById("show-password");
        showPassBtn.setAttribute("disabled", true);

        const visibilityButton = document.getElementById("show-password");
        visibilityButton.className = "visibility";

        if (passwordTimeout) {
            clearTimeout(passwordTimeout);
        }

        setPasswordTimeout(setTimeout(() => {
            password.type = "password";
            showPassBtn.removeAttribute("disabled");
            visibilityButton.className = "no-visibility";
        }, 1000));
    }

    return (
        <div id="accounts-info-div">
            <div id="info-nav">
                <div id="left-nav">
                    <button id="close-info"
                     onClick={() => { setShowAccountInfo(false) }}></button>
                </div>

                <div id="right-nav">
                    <button id="favorite" className="not-favorite"
                     onClick={ () => setFavorite([account.id, !account.favorite]) }></button>
                    <button id="edit-account"
                     onClick={ () => { setEditAccount(true) } }></button>
                    <button id="delete"
                     onClick={ () => deleteAccount(account.id) }></button>
                </div>
            </div>

            <Notification langFile={langFile} accounts={accounts} account={account} notificationId={"account-info-notification"} />

            <div id="account-info">
                <div id="service-info">
                    <p id="service-title" className="info-title">{serviceTitle}</p>
                    <input type="text" className="info-input" id="show-service-info" placeholder="Service Info" readOnly />
                </div>

                <div id="username-info">
                    <p id="username-title" className="info-title">{usernameTitle}</p>
                    <input type="text" id="show-username-info" className="info-input" placeholder="Username Info" readOnly />
                    <button id="copy-username"
                    onClick={ () => copy('show-username-info') } className="copy-button"></button>
                </div>

                <div id="password-info">
                    <p id="password-title" className="info-title">{passwordTitle}</p>
                    <input type="password" id="show-password-info" className="info-input" placeholder="Password Info" readOnly />
                    <button id="copy-password"
                    onClick={ () => copy("show-password-info") } className="copy-button"></button>
                    <button id="show-password"
                    onClick={ () => turnPassVisibility() } className="no-visibility"></button>
                </div>

                <div id="notes-info">
                    <p id="notes-title" className="info-title">{notesTitle}</p>
                    <input type="text" id="show-notes-info" className="info-input" placeholder="Notes Info" readOnly />
                </div>

                <div id="additional-info">
                    <p id="last-modified">{lastModifiedText}</p>
                    <p id="created-date">{createdText}</p>
                </div>
            </div>
        </div>
    );
}

export default AccountsInfo;
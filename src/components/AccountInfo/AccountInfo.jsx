import { React, useEffect, useState } from "react";
import "./AccountInfo.css";

import { getConfigValue } from "../Config/config";
import { getMsgLang } from "../Config/lang";
import { deleteAccount, editAccountKey, getAccount } from "../Config/accountsManager/manager";
import { checkPasswordSecurity, checkPasswordUnique } from "../Config/security";


export function AccountsInfo({ accounts, setAccounts, showAccountInfo, setShowAccountInfo, selectedId, setSelectedId, favorite, setFavorite, setSearchTerm }) {
    const [account, setAccount] = useState({});
    const [service, setService] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [notes, setNotes] = useState("");
    const [securityLevel, setSecurityLevel] = useState(0);
    const [securityMessage, setSecurityMessage] = useState("");

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
        const loadAccount = async () => {
            setAccount(getAccount(accounts, selectedId));
        }

        if (!selectedId || selectedId === "") return;

        loadAccount();
    }, [selectedId]);

    useEffect(() => {
        if (!account) return;

        setFavorite([account.id, account.favorite]);
        setService(account.service);
        setUsername(account.username);
        setPassword(account.password);
        setNotes(account.notes);

        // test security
        if (!account.password) {
            setSecurityLevel(0);
            setSecurityMessage("Sua conta não possui uma senha.")
            return;
        }

        const isSecure = checkPasswordSecurity(account.password);
        if (!isSecure) {
            setSecurityLevel(1);
            setSecurityMessage("A senha não é segura o suficiente.")
            return;
        }

        const isUnique = checkPasswordUnique(accounts, account.password);
        if (!isUnique) {
            setSecurityLevel(1);
            setSecurityMessage("Mais de uma conta possuem a mesma senha.");
            return;
        }

        setSecurityLevel(2);
        setSecurityMessage("Sua conta está segura.");
    }, [account]);

    useEffect(() => {
        const notificationStatus = document.getElementById("notification");
        if (securityLevel === 0) {
            notificationStatus.className = "warning";
        } else if (securityLevel === 1) {
            notificationStatus.className = "alert";
        } else if (securityLevel === 2) {
            notificationStatus.className = "safe";
        }
    }, [securityLevel])

    useEffect(() => {
        const updateFavorite = async () => {
            const acc = getAccount(accounts, favorite[0]);

            if (favorite[1] !== acc.favorite) {
                setAccounts(await editAccountKey(accounts, favorite[0], "favorite", favorite[1]));                
            }

            // change the favorite icon
            const favoriteButton = document.getElementById("favorite");
            if (favorite[1]) {
                console.log("updating favorite icon")
                favoriteButton.className = "favorite";
            } else {
                favoriteButton.className = "not-favorite";
            }
        }

        if (!favorite[0]) return;
        updateFavorite();
    }, [favorite]);

    const [langSet, setLangSet] = useState("");
    const [confirmDeleteMsg, setConfirmDeleteMsg] = useState("");
    const [serviceTitle, setServiceTitle] = useState("");
    const [usernameTitle, setUsernameTitle] = useState("");
    const [passwordTitle, setPasswordTitle] = useState("");
    const [notesTitle, setNotesTitle] = useState("");
    const [lastModifiedText, setLastModifiedText] = useState("");
    const [createdText, setCreatedText] = useState("");

    useEffect(() => {
        const loadLang = async () => {
            setLangSet(await getConfigValue("lang"));
        }

        loadLang();
    }, []);

    useEffect(() => {
        const setLangMsg = async () => {
            setServiceTitle(await getMsgLang(langSet, "AccountInfo", "service.title"));
            setUsernameTitle(await getMsgLang(langSet, "AccountInfo", "username.title"));
            setPasswordTitle(await getMsgLang(langSet, "AccountInfo", "password.title"));
            setNotesTitle(await getMsgLang(langSet, "AccountInfo", "notes.title"));
            setLastModifiedText(await getMsgLang(langSet, "AccountInfo", "additional-info.last_modified"));
            setCreatedText(await getMsgLang(langSet, "AccountInfo", "additional-info.created"));
        }

        setLangMsg();
    }, [langSet]);

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
        }, 2000));
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
                    <button id="edit-account"></button>
                    <button id="etc"></button>
                </div>
            </div>

            <div id="notification">
                {securityMessage}
            </div>

            <div id="account-info">
                <div id="service-info">
                    <p id="service-title" className="info-title">{serviceTitle}</p>
                    <input type="text" className="info-input" id="show-service-info" placeholder="Service Info" value={service} readOnly />
                </div>

                <div id="username-info">
                    <p id="username-title" className="info-title">{usernameTitle}</p>
                    <input type="text" id="show-username-info" className="info-input" placeholder="Username Info" value={username} readOnly />
                    <button id="copy-username"
                    onClick={ () => copy('show-username-info') } className="copy-button"></button>
                </div>

                <div id="password-info">
                    <p id="password-title" className="info-title">{passwordTitle}</p>
                    <input type="password" id="show-password-info" className="info-input" placeholder="Password Info" value={password} readOnly />
                    <button id="copy-password"
                    onClick={ () => copy("show-password-info") } className="copy-button"></button>
                    <button id="show-password"
                    onClick={ () => turnPassVisibility() } className="no-visibility"></button>
                </div>

                <div id="notes-info">
                    <p id="notes-title" className="info-title">{notesTitle}</p>
                    <input type="text" id="show-notes-info" className="info-input" placeholder="Notes Info" value={notes} readOnly />
                </div>

                <div id="additional-info">
                    <p id="last-modified">{lastModifiedText} {account.last_modified}</p>
                    <p id="created-date">{createdText} {account.created}</p>
                </div>
            </div>
        </div>
    );
}

export default AccountsInfo;
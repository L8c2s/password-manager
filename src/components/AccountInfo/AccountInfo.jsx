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

            if (favorite[1] === acc.favorite) {
                return;
            }

            setAccounts(await editAccountKey(accounts, favorite[0], "favorite", favorite[1]));
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

    const [langSet, setLangSet] = useState("");
    const [confirmDeleteMsg, setConfirmDeleteMsg] = useState("");

    useEffect(() => {
        const loadLang = async () => {
            setLangSet(await getConfigValue("lang"));
        }

        loadLang();
    }, [])

    const removeAccount = async () => {
        if (!selectedId) return;

        const confirmDelete = await window.confirm(await getMsgLang(langSet, "AccountInfo", "delete.confirmation"));
        if (!confirmDelete) return;

        setAccounts(await deleteAccount(accounts, selectedId));
        setSearchTerm("");
        setShowAccountInfo(false);
        setSelectedId("");
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
                    <button id="etc" onClick={ () => removeAccount() }></button>
                </div>
            </div>

            <div id="notification">
                {securityMessage}
            </div>

            <p>{service}</p>
            <p>{username}</p>
            <p>{password}</p>
            <p>{notes}</p>
        </div>
    );
}

export default AccountsInfo;
import { React, useEffect, useState } from "react";
import "./AccountInfo.css";

import { getConfigValue } from "../Config/config";
import { getMsgLang } from "../Config/lang";
import { deleteAccount, editAccountKey, getAccount, setAccountFavorite } from "../Config/accountsManager/manager";


export function AccountsInfo({ accounts, setAccounts, showAccountInfo, setShowAccountInfo, selectedId, setSelectedId, favorite, setFavorite, setSearchTerm }) {
    const [account, setAccount] = useState({});
    const [service, setService] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [notes, setNotes] = useState("");

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

        setFavorite(account.favorite);
        setService(account.service);
        setUsername(account.username);
        setPassword(account.password);
        setNotes(account.notes);
    }, [account]);

    useEffect(() => {
        const updateFavorite = async () => {
            if (!selectedId || selectedId === "") return;

            if (favorite !== account.favorite) {
                setAccounts(await editAccountKey(accounts, selectedId, "favorite", favorite));
            }

            // change the favorite icon
            const favoriteButton = document.getElementById("favorite");
            if (favorite) {
                favoriteButton.className = "favorite";
            } else {
                favoriteButton.className = "not-favorite";
            }
        }

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
                     onClick={ () => setFavorite(!favorite) }></button>
                    <button id="edit-account"></button>
                    <button id="etc" onClick={ () => removeAccount() }></button>
                </div>
            </div>

            <div id="notification"></div>

            <p>{service}</p>
            <p>{username}</p>
            <p>{password}</p>
            <p>{notes}</p>
        </div>
    );
}

export default AccountsInfo;
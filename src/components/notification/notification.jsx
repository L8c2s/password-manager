// notification receives account
// tests is there is a password in this account
// if true, tests the password strength
// sets the notification message accordingly

import { React, useState, useEffect } from "react";

import { invoke } from "@tauri-apps/api/core";
import { checkPasswordSecurity, checkPasswordUnique } from "../Config/security";

export function Notification({ langFile, accounts, account, notificationId, setUpdatePassWarn=(a) => {} }) {
    const [securityLevel, setSecurityLevel] = useState(0);
    const [securityMessage, setSecurityMessage] = useState("");

    useEffect(() => {
        testPassword();
    }, [account]);

    useEffect(() => {
        const notificationStatus = document.getElementById(notificationId);

        if (securityLevel === 0) {
            notificationStatus.classList.add("warning");
            notificationStatus.classList.remove("alert", "safe", "no-notification");
        } else if (securityLevel === 1) {
            notificationStatus.classList.add("alert");
            notificationStatus.classList.remove("warning", "safe", "no-notification");
        } else if (securityLevel === 2) {
            notificationStatus.classList.add("safe");
            notificationStatus.classList.remove("warning", "alert", "no-notification");
        } else {
            notificationStatus.classList.add("no-notification");
            notificationStatus.classList.remove("safe", "warning", "alert")
        }

        setUpdatePassWarn(true);
    }, [securityLevel]);

    const [noPasswordText, setNoPasswordText] = useState("");
    const [notSafeEnough, setNotSafeEnough] = useState("");
    const [isNotUnique, setIsNotUnique] = useState("");
    const [safeAccount, setSafeAccount] = useState("");
    const [verifying, setVerifying] = useState("");

    const testPassword = async () => {
        
        if (!account || !account.service || !account.username) {
            setSecurityLevel(-1);
            setSecurityMessage("");
            return;
        }

        let userPassword = await invoke("decrypt_password", { encryptedPassword: account.password });

        if (!userPassword) {
            setSecurityLevel(0);
            setSecurityMessage(noPasswordText);
            return;
        }

        const isSecure = checkPasswordSecurity(userPassword);
        if (!isSecure) {
            setSecurityLevel(1);
            setSecurityMessage(notSafeEnough);
            return;
        }

        const isUnique = await checkPasswordUnique(accounts, account.id, userPassword);
        if (isUnique >= 1) {
            setSecurityLevel(1);
            setSecurityMessage(isNotUnique);
            return;
        }

        setSecurityLevel(2);
        setSecurityMessage(safeAccount);
    }

    useEffect(() => {
        setNoPasswordText(langFile.messages.levelSecurityNoPassword);
        setNotSafeEnough(langFile.messages.levelSecurityNotSafeEnough);
        setIsNotUnique(langFile.messages.levelSecurityRepeatedPassword);
        setSafeAccount(langFile.messages.levelSecuritySafe);
        setVerifying(langFile.messages.verifying);
    }, [langFile]);

    return (
        <div id={notificationId} className="notification">
            {securityMessage}
        </div>
    );
}
// notification receives account
// tests is there is a password in this account
// if true, tests the password strength
// sets the notification message accordingly

import { React, useState, useEffect } from "react";
import "./notification.css";

import { getConfigValue } from "../Config/config";
import { getMsgLang } from "../Config/lang";
import { checkPasswordSecurity, checkPasswordUnique } from "../Config/security";

export function Notification({ accounts, account, notificationId, setUpdatePassWarn=(a) => {} }) {
    const [securityLevel, setSecurityLevel] = useState(0);
    const [securityMessage, setSecurityMessage] = useState("");
    const [langSet, setLangSet] = useState("");

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

    const testPassword = () => {
        if (!account || !account.service || !account.username) {
            setSecurityLevel(-1);
            setSecurityMessage("-");
            return;
        }

        if (!account.password) {
            setSecurityLevel(0);
            setSecurityMessage(noPasswordText);
            return;
        }

        const isSecure = checkPasswordSecurity(account.password);
        if (!isSecure) {
            setSecurityLevel(1);
            setSecurityMessage(notSafeEnough);
            return;
        }

        const isUnique = checkPasswordUnique(accounts, account);
        if (isUnique >= 1) {
            setSecurityLevel(1);
            setSecurityMessage(isNotUnique);
            return;
        }

        setSecurityLevel(2);
        setSecurityMessage(safeAccount);
    }

    useEffect(() => {
        const loadLang = async () => {
            setLangSet(await getConfigValue("lang"));
        }

        loadLang();
    }, []);

    useEffect(() => {
        const loadMessages = async () => {
            setNoPasswordText(await getMsgLang(langSet, "notification", "level_security.no_password"));
            setNotSafeEnough(await getMsgLang(langSet, "notification", "level_security.not_safe_enough"));
            setIsNotUnique(await getMsgLang(langSet, "notification", "level_security.repeated_password"));
            setSafeAccount(await getMsgLang(langSet, "notification", "level_security.safe"));
        }

        loadMessages();
    }, [langSet]);

    return (
        <div id={notificationId} className="notification">
            {securityMessage}
        </div>
    );
}

export default Notification;
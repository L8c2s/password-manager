import { React, useEffect, useState } from "react";
import "./AddEditAccount.css";
import { getConfigValue } from "../Config/config";
import { getMsgLang } from "../Config/lang";
import { getAccount, getAccounts, saveAccounts } from "../Config/accountsManager/manager";

import { Notification } from "../notification/notification";
import { save } from "@tauri-apps/api/dialog";

// como vai funcionar
// quando clicar em nova conta:
// o componente vai carregar um objeto de conta, gerar um id e adicionar no objeto
// os campos são preenchidos com placeholders traduzidos

export function AddEditAccount({ langSet, accounts, setAccounts, editAccount, setEditAccount, addAccount, setAddAccount, selectedId, setShowAccountInfo }) {
    const [loaded, setLoaded] = useState(false);
    const [account, setAccount] = useState({});
    const [randomPassword, setRandomPassword] = useState("");
    const [lastRandomUsed, setLastRandomUsed] = useState("");
    const [lengthNumber, setLengthNumber] = useState(12);
    const [accountIndex, setAccountIndex] = useState(-1);
    const [updatePassWarn, setUpdatePassWarn] = useState(false);
    const [isButtonVisible, setIsButtonVisible] = useState(true);

    const generatePassword = (length=8) => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-={}[]\:;'<>,.?/~`";
        let password = "";

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * chars.length);
            password += chars.charAt(randomIndex);
        }

        const lower = /[a-z]/.test(password);
        const upper = /[A-Z]/.test(password);
        const number = /[0-9]/.test(password);
        const symbol = /[^a-zA-Z0-9]/.test(password);

        if (!lower && !upper) return generatePassword(length);
        if (!number) return generatePassword(length);
        if (!symbol) return generatePassword(length);

        return password;
    }

    const checkKeys = (acc) => {
        if (!acc.hasOwnProperty("password_history")) {
            acc.password_history = [acc.password];
        } if (!acc.hasOwnProperty("created")) {
            acc.created = "-";
        } if (!acc.hasOwnProperty("favorite")) {
            acc.favorite = false;
        } if (!acc.hasOwnProperty("id")) {
            acc.id = generatePassword(6);
        }

        return acc;
    }

    const getDateTime = () => {
        const date = new Date();

        let day = date.getDate();
        let month = date.getMonth() + 1;
        let year = date.getFullYear();
        
        let hour = date.getHours();
        let minute = date.getMinutes();
        let second = date.getSeconds();

        if (day < 10)
            day = `0${day}`;
        if (month < 10)
            month = `0${month}`;

        if (hour < 10)
            hour = `0${hour}`;
        if (minute < 10)
            minute = `0${minute}`;
        if (second < 10)
            second = `0${second}`;

        return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
    }

    const updateRandomPassword = () => {
        let randomPass = "";
        if (!randomPassword || randomPassword === lastRandomUsed) {
            const passwordLength = document.getElementById("password-length").value;
            randomPass = generatePassword(passwordLength);
        } else {
            randomPass = randomPassword;
        }

        document.getElementById("edit-password").value = randomPass;
        setRandomPassword(randomPass);
        setLastRandomUsed(randomPass);
    }

    const updateAccount = () => {
        const service = document.getElementById("edit-service");
        const username = document.getElementById("edit-username");
        const password = document.getElementById("edit-password");
        const notes = document.getElementById("edit-notes");

        updateWarnStyle(service, username);

        let updater = {...account};

        updater.service = service.value;
        updater.username = username.value;
        updater.password = password.value;
        updater.notes = notes.value;

        setAccount(updater);
    }

    const updateWarnStyle = (service, username) => {
        let safeService = false;

        if (!service.value) {
            service.classList.remove("safe-value");
            service.classList.add("not-safe-value");
        } else {
            service.classList.remove("not-safe-value");
            service.classList.add("safe-value");
            safeService = true;
        }

        let safeUsername = false;
        // check if the account already exists
        const exists = checkAccount(service.value, username.value);
        if (!username.value || exists) {
            username.classList.remove("safe-value");
            username.classList.add("not-safe-value");
        } else {
            username.classList.remove("not-safe-value");
            username.classList.add("safe-value");
            safeUsername = true;
        }

        const saveButton = document.getElementById("save-account");
        if (safeService && safeUsername)
            saveButton.removeAttribute("disabled");
        else
            saveButton.setAttribute("disabled", "true");
    }

    useEffect(() => {
        const password = document.getElementById("edit-password");

        const currentPassWarn = document.getElementById("edit-account-notification").classList;
        if (currentPassWarn.contains("safe")) {
            password.classList.remove("not-safe-value", "not-safe-password");
            password.classList.add("safe-value");
        } else if (currentPassWarn.contains("alert")) {
            password.classList.remove("not-safe-value", "safe-value");
            password.classList.add("not-safe-password");
        } else if (currentPassWarn.contains("warning")) {
            password.classList.remove("not-safe-password", "safe-value");
            password.classList.add("not-safe-value");
        }

        setUpdatePassWarn(false);
    }, [updatePassWarn])

    const checkAccount = (accountService, accountUsername) => {
        for (const service in accounts)
            if (service === accountService)
                for (let i = 0; i < accounts[service].length; i++)
                    if (accounts[service][i].username === accountUsername)
                        if (accounts[service][i].id !== account.id)
                            return true;
        return false;
    }

    const enableLengthDisplay = (enable) => {
        const displayLength = document.getElementById("display-length");
        if (enable) {
            displayLength.className = "appear";
        } else
            displayLength.className = "hide";
    }

    const applyAccount = async () => {
        let acc = account;
        let allAccounts = accounts;

        if (addAccount) {
            acc.created = getDateTime();
        }
        acc.last_modified = getDateTime();

        if (!allAccounts[acc.service]) {
            allAccounts[acc.service] = [];
        }

        if (!acc.password_history.includes(acc.password))
            acc.password_history.push(acc.password);

        if (accountIndex === -1) {
            allAccounts[acc.service].push(acc);
        } else {
            const accountSaved = getAccount(allAccounts, acc.id);
            if (accountSaved.service !== acc.service) {
                allAccounts[accountSaved.service].splice(accountIndex);
                allAccounts[acc.service].push(acc);
            } else
                allAccounts[acc.service][accountIndex] = acc;
        }

        await saveAccounts(allAccounts);
        setAccounts(await getAccounts());
        setAddAccount(false);
        setEditAccount(false);
    }

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
                setIsButtonVisible(false);
            } else {
                setIsButtonVisible(true);
            }
        }

        const addAccountShortcut = (event) => {
            if (event.ctrlKey && event.key === "n") {
                setAddAccount(true);
            }
        }

        window.addEventListener("scroll", handleScroll);
        window.addEventListener("keydown", addAccountShortcut);
        return () => {
            window.removeEventListener("scroll", handleScroll)
            window.removeEventListener("keydown", addAccountShortcut);
        };
    }, []);

    useEffect(() => {
        const on = () => {
            const fullWindow = document.getElementById("add-edit-account-full-window");
            fullWindow.style = "display: block;";
            fullWindow.className = "zoom-in";
        }

        const off = () => {
            const fullWindow = document.getElementById("add-edit-account-full-window");
            fullWindow.className = "zoom-out";
            setTimeout(() => fullWindow.style = "display: none;", 500);
            setAddAccount(false);
            setEditAccount(false);
        }

        let generatedId;
        // generate an ID, check if the ID is unique, if True, save index as -1, else, save index as the index of the account in the service list
        const getAccountIndex = () => {
            for (const service in accounts) {
                for (let i = 0; i < accounts[service].length; i++) {
                    const acc = accounts[service][i]
                    if (acc.id == generatedId) {
                        setAccountIndex(i);
                        return i;
                    }
                }
            }
            return -1;
        }

        if (editAccount) {
            let tmpAccount = getAccount(accounts, selectedId);
            if (!tmpAccount) {
                return;
            }

            generatedId = selectedId;
            const index = getAccountIndex();

            tmpAccount = checkKeys(tmpAccount);

            setAccount(tmpAccount);
            setLoaded(true);
            on();
        } else if (addAccount) {
            let index = -2;

            while (index !== -1) {
                generatedId = generatePassword(6);
                index = getAccountIndex();
                setAccountIndex(index);
            }

            setAccount({
                id: generatedId,
                service: "",
                username: "",
                password: "",
                notes: "",
                favorite: false,
                password_history: [],
                last_modified: "",
                created: ""
            });
            setLoaded(true);
            on();
        } else {
            off();
            updateEditorValues();
            setLoaded(false);
            return;
        }
    }, [editAccount, addAccount]);

    const [title, setTitle] = useState("");
    const [usernamePlaceHld, setUsernamePlaceHld] = useState("");
    const [notesPlaceHld, setNotesPlaceHld] = useState("");
    const [saveButton, setSaveButton] = useState("");
    const [cancelButton, setCancelButton] = useState("");
    const [generatePasswordText, setGeneratePasswordText] = useState("");
    const [serviceTitle, setServiceTitle] = useState("");
    const [usernameTitle, setUsernameTitle] = useState("");
    const [passwordTitle, setPasswordTitle] = useState("");
    const [notesTitle, setNotesTitle] = useState("");
    const [notificationPreviewTitle, setNotificationPreviewTitle] = useState(""); 
    const [passwordLengthDisplay, setPasswordLengthDisplay] = useState("");

    const updateEditorValues = () => {
        document.getElementById("edit-service").value = account.service;
        document.getElementById("edit-username").value = account.username;
        document.getElementById("edit-password").value = account.password;
        document.getElementById("edit-notes").value = account.notes;
    }

    useEffect(() => {
        updateEditorValues();
        setRandomPassword(generatePassword(12));

        const loadLangText = async () => {
            if (addAccount)
                setTitle(await getMsgLang(langSet, "AddEditAccount", "add_account.title"));
            else if (editAccount)
                setTitle(await getMsgLang(langSet, "AddEditAccount", "edit_account.title"));
            setUsernamePlaceHld(await getMsgLang(langSet, "AddEditAccount", "edit_username.placeholder"));
            setNotesPlaceHld(await getMsgLang(langSet, "AddEditAccount", "edit_notes.placeholder"));
            setSaveButton(await getMsgLang(langSet, "AddEditAccount", "save_button.text"));
            setCancelButton(await getMsgLang(langSet, "AddEditAccount", "cancel_button.text"));
            setGeneratePasswordText(await getMsgLang(langSet, "AddEditAccount", "generate_password.text"));
            setServiceTitle(await getMsgLang(langSet, "AccountInfo", "service.title"));
            setUsernameTitle(await getMsgLang(langSet, "AccountInfo", "username.title"));
            setPasswordTitle(await getMsgLang(langSet, "AccountInfo", "password.title"));
            setNotesTitle(await getMsgLang(langSet, "AccountInfo", "notes.title"));
            setNotificationPreviewTitle(await getMsgLang(langSet, "AddEditAccount", "notification_preview.title"));
            setPasswordLengthDisplay(await getMsgLang(langSet, "AddEditAccount", "password_length.display"));
        }

        if (!langSet) return;
        loadLangText();

        const service = document.getElementById("edit-service");
        const username = document.getElementById("edit-username");

        updateWarnStyle(service, username);
    }, [langSet, loaded]);

    return (
        <div id="add-edit-account-main">
            <div id="add-account-space">
                <button id="add-account-button"
                 onClick={ () => { setAddAccount(true) } }
                 style={{ display: isButtonVisible ? "block" : "none" }}></button>
            </div>

            <div id="add-edit-account-full-window">
                <div id="add-edit-account-blur"
                onClick={ () => { setAddAccount(false); setEditAccount(false) } }></div>

                <div id="add-edit-account">
                    <div id="title-bar">
                        <h1 id="add-edit-title">{title}</h1>
                    </div>

                    <h2 id="notification-preview-title" className="info-title">{notificationPreviewTitle}</h2>
                    <Notification accounts={accounts} account={account} notificationId={"edit-account-notification"} setUpdatePassWarn={setUpdatePassWarn} />

                    <div id="edit-account-info">
                        <div id="edit-service-div">
                            <h2 id="service-title" className="info-title">{serviceTitle}</h2>
                            <input type="text" id="edit-service" className="info-input" placeholder="Website[.com]" onChange={ () => updateAccount() } />
                        </div>

                        <div id="edit-username-div">
                            <p id="username-title" className="info-title">{usernameTitle}</p>
                            <input type="text" id="edit-username" className="info-input" placeholder={usernamePlaceHld} onChange={ () => updateAccount() } />
                        </div>

                        <div id="edit-password-div">
                            <p id="password-title" className="info-title">{passwordTitle}</p>
                            <div id="align-items">
                                <input type="text" id="edit-password" className="info-input" placeholder={randomPassword}
                                 onChange={ () => updateAccount() } />
                                <button id="generate-password"
                                 onClick={ () => { updateRandomPassword(); updateAccount() } }></button>
                            </div>

                            <div id="inline-length-display">
                                <input type="range" name="length-number" id="password-length" max={20} min={8} defaultValue={12} onChange={ (e) => {setLengthNumber(e.target.value); setRandomPassword(generatePassword(e.target.value))} } onMouseOver={ () => enableLengthDisplay(1) } onMouseOut={ () => enableLengthDisplay(0) } />
                                <p id="display-length">{passwordLengthDisplay} {lengthNumber}</p>
                            </div>
                        </div>

                        <div id="edit-notes-div">
                            <p id="notes-title" className="info-title">{notesTitle}</p>
                            <input type="text" id="edit-notes" className="info-input safe-value" placeholder={notesPlaceHld} onChange={ () => updateAccount() } />
                        </div>

                        <div id="form-buttons">
                            <button id="save-account"
                            onClick={ () => { applyAccount(); setShowAccountInfo(false) }}>{saveButton}</button>
                            <button id="cancel-operation"
                            onClick={ () => { setAddAccount(false); setEditAccount(false) } }>{cancelButton}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AddEditAccount;

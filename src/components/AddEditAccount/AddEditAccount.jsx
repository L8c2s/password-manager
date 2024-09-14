import { React, useEffect, useState } from "react";
import "./AddEditAccount.css";
import { getConfigValue } from "../Config/config";
import { getMsgLang } from "../Config/lang";
import { getAccount, getAccounts, saveAccounts } from "../Config/accountsManager/manager";

import { Notification } from "../notification/notification";

// como vai funcionar
// quando clicar em nova conta:
// o componente vai carregar um objeto de conta, gerar um id e adicionar no objeto
// os campos são preenchidos com placeholders traduzidos

export function AddEditAccount({ accounts, setAccounts, editAccount, setEditAccount, addAccount, setAddAccount, selectedId, setShowAccountInfo }) {
    const [langSet, setLangSet] = useState("");
    const [loaded, setLoaded] = useState(false);
    const [account, setAccount] = useState({});
    const [randomPassword, setRandomPassword] = useState("");
    const [lastRandomUsed, setLastRandomUsed] = useState("");
    const [lengthNumber, setLengthNumber] = useState(12);
    const [accountIndex, setAccountIndex] = useState(-1);

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
        } if (!acc.hasOwnProperty("editing")) {
            acc.editing = true;
        }

        return acc;
    }

    const getDateTime = () => {
        const date = new Date();

        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        
        const hour = date.getHours();
        const minute = date.getMinutes();
        const second = date.getSeconds();

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
        const service = document.getElementById("edit-service").value;
        const username = document.getElementById("edit-username").value;
        const password = document.getElementById("edit-password").value;
        const notes = document.getElementById("edit-notes").value;

        let updater = {...account};

        updater.service = service;
        updater.username = username;
        updater.password = password;
        updater.notes = notes;

        setAccount(updater);
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
        const loadLang = async () => {
            setLangSet(await getConfigValue("lang"));
        }

        loadLang();
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

    useEffect(() => {
        if (account.service && account.username) {
            document.getElementById("save-account").removeAttribute("disabled");
        } else {
            document.getElementById("save-account").setAttribute("disabled", "true");
        }
    }, [account])

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
    }, [langSet, loaded]);

    return (
        <div id="add-edit-account-main">
            <div id="add-account-space">
                <button id="add-account-button"
                 onClick={ () => { setAddAccount(true) } }></button>
            </div>

            <div id="add-edit-account-full-window">
                <div id="add-edit-account-blur"
                onClick={ () => { setAddAccount(false); setEditAccount(false) } }></div>

                <div id="add-edit-account">
                    <div id="title-bar">
                        <h1 id="add-edit-title">{title}</h1>
                    </div>

                    <h2 id="notification-preview-title" className="info-title">{notificationPreviewTitle}</h2>
                    <Notification accounts={accounts} account={account} notificationId={"edit-account-notification"} />

                    {/*
                        // todo: add a small border bottom at every info-input and use it to tell the user about the status of the value
                        // todo: if the service is empty, the border will be red and when hover above the service input a message on the right side of the service title
                        // todo: between "()" will tell the user the problem will appear like the length message or the sortFilter message. Do this to every input, the notes input will always be green
                    */}

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
                            <input type="text" id="edit-notes" className="info-input" placeholder={notesPlaceHld} onChange={ () => updateAccount() } />
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

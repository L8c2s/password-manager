import { React, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./AddEditAccount.css";

import { getMsg } from "../Config/lang";
import { getAccount, getAccounts, saveAccounts, getDateTime, generatePassword } from "../Config/accountsManager/manager";
import { findCorrectLeft } from "../Config/config";

import { Notification } from "../notification/notification";

import { Automation } from "../../../tests/automate";

// como vai funcionar
// quando clicar em nova conta:
// o componente vai carregar um objeto de conta, gerar um id e adicionar no objeto
// os campos são preenchidos com placeholders traduzidos

export function AddEditAccount({ langFile, accounts, setAccounts, editAccount, setEditAccount, addAccount, setAddAccount, selectedId, setShowAccountInfo, automation }) {
    const [loaded, setLoaded] = useState(false);
    const [account, setAccount] = useState({});
    const [randomPassword, setRandomPassword] = useState("");
    const [lastRandomUsed, setLastRandomUsed] = useState("");
    const [lengthNumber, setLengthNumber] = useState(12);
    const [accountIndex, setAccountIndex] = useState(-1);
    const [updatePassWarn, setUpdatePassWarn] = useState(false);
    const [isButtonVisible, setIsButtonVisible] = useState(true);

    const checkKeys = (acc) => {
        acc.password_history = acc.password_history ?? [{"password": acc.password, "added": "unknown"}];
        acc.created = acc.created ?? "";
        acc.last_modified = acc.last_modified ?? "";
        acc.favorite = acc.favorite ?? false;
        acc.id = acc.id ?? generatePassword(6);

        return acc;
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
        if (!loaded) return;

        let safeService = false;

        if (!service.value) {
            service.classList.remove("safe-value");
            service.classList.add("not-safe-value");
            // console.log("There must be at least one character as Service.");
        } else {
            service.classList.remove("not-safe-value");
            service.classList.add("safe-value");
            safeService = true;
        }

        let safeUsername = false;
        // the username verification is not simplified for debugging reasons
        const exists = checkAccount(service.value, username.value);
        if (!username.value) {
            username.classList.remove("safe-value");
            username.classList.add("not-safe-value");
            // console.log("There must be at least one character as Username.");
        } else if (exists) {
            username.classList.remove("safe-value");
            username.classList.add("not-safe-value");
            // console.log("The Username already exists for this Service.")
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
            password.classList.remove("not-safe-value", "not-safe-password", "no-value");
            password.classList.add("safe-value");
        } else if (currentPassWarn.contains("alert")) {
            password.classList.remove("not-safe-value", "safe-value", "no-value");
            password.classList.add("not-safe-password");
        } else if (currentPassWarn.contains("warning")) {
            password.classList.remove("not-safe-password", "safe-value", "no-value");
            password.classList.add("not-safe-value");
        } else if (currentPassWarn.contains("no-notification")) {
            password.classList.remove("not-safe-password", "safe-value", "not-safe-value");
            password.classList.add("no-value");
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

    const checkId = (accountId) => {
        for (const service in accounts) {
            for (const account of accounts[service]) {
                if (account.id === accountId) {
                    return true;
                }
            }
        }

        return false;
    }

    const applyAccount = async (newAccount = null) => {
        setSaveButton(savingText);

        const apply = document.getElementById("save-account");
        apply.setAttribute("disabled", "true");

        let acc;
        if (newAccount) {
            acc = newAccount;
        } else {
            acc = account;
        }
    
        let allAccounts = accounts;

        let accountExists = checkId(acc.id);
        if (accountExists && !editAccount && addAccount) {
            apply.removeAttribute("disabled");
            // console.log(`Account ID (${acc.id}) already registered.`);
            return false;
        }

        if (addAccount) {
            acc.created = await getDateTime();
        }
        acc.last_modified = await getDateTime();

        let currentPassword;

        if (addAccount) {
            currentPassword = acc.password;
            acc.password = await invoke("encrypt_password", { password: acc.password });
        } else {
            currentPassword = await invoke("decrypt_password", { encryptedPassword: acc.password });
        }

        if (!allAccounts[acc.service]) {
            allAccounts[acc.service] = [];
        }

        if (!acc.password_history) {
            acc.password_history = [];
        }

        let passInHistory = false;
        for (let i = 0; i < acc.password_history.length; i++) {
            if (!acc.password_history[i]["password"]) continue;

            const historicPassword = await invoke("decrypt_password", { encryptedPassword: acc.password_history[i]["password"] });
            if (historicPassword === currentPassword) {
                passInHistory = true;
            }
        }

        if (!passInHistory) {
            acc.password_history.unshift({
                password: acc.password,
                added: acc.last_modified
            })
        }

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

    const automate = async () => {
        console.log("Automating AddAccount process...");

        let lastId = null;
        let currentId = "";

        let _account;
        while (currentId !== lastId && currentId !== null) {
            console.log("Inside loop...")

            _account = await Automation(currentId);
            if (_account === undefined) break;

            console.log("Setting `account` to ", _account);

            if (currentId) {
                lastId = currentId;
            }
            console.log("Updating ID to ", _account.id);
            currentId = _account.id;

            console.log("Adding account with ID: ", currentId);
            await applyAccount(_account);
        }
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

        if (automation) {
            automate();
        };

        return () => {
            window.removeEventListener("scroll", handleScroll)
            window.removeEventListener("keydown", addAccountShortcut);
        };
    }, []);

    const correctLeft = (e) => {
        findCorrectLeft(document.getElementById("add-edit-account"));
    }
    window.addEventListener("resize", correctLeft);

    useEffect(() => {
        const on = () => {
            const fullWindow = document.getElementById("add-edit-account-full-window");
            fullWindow.style = "display: block;";
            fullWindow.className = "zoom-in";
            document.getElementById("edit-service").focus();
            findCorrectLeft(document.getElementById("add-edit-account"));
        }

        const off = () => {
            const fullWindow = document.getElementById("add-edit-account-full-window");
            fullWindow.className = "zoom-out";
            setAddAccount(false);
            setEditAccount(false);
        }

        const updateValues = async () => {
            await updateEditorValues();
        }

        let generatedId;
        // generate an ID, check if the ID is unique, if True, save index as -1, else, save index as the index of the account in the service list
        const getAccountIndex = () => {
            for (const service in accounts) {
                for (let i = 0; i < accounts[service].length; i++) {
                    const acc = accounts[service][i]
                    if (acc.id === generatedId) {
                        setAccountIndex(i);
                        return i;
                    }
                }
            }
            return -1;
        }

        if (editAccount) {
            let tmpAccount = getAccount(accounts, selectedId);
            if (!tmpAccount || tmpAccount === undefined) {
                return;
            }

            generatedId = selectedId;
            tmpAccount = checkKeys(tmpAccount);
            getAccountIndex();

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
            updateValues();
            setLoaded(false);
            return;
        }
    }, [editAccount, addAccount]);

    const [title, setTitle] = useState("");
    const [usernamePlaceHld, setUsernamePlaceHld] = useState("");
    const [notesPlaceHld, setNotesPlaceHld] = useState("");
    const [saveButton, setSaveButton] = useState("");
    const [cancelButton, setCancelButton] = useState("");
    const [serviceTitle, setServiceTitle] = useState("");
    const [usernameTitle, setUsernameTitle] = useState("");
    const [passwordTitle, setPasswordTitle] = useState("");
    const [notesTitle, setNotesTitle] = useState("");
    const [notificationPreviewTitle, setNotificationPreviewTitle] = useState(""); 
    const [passwordLengthDisplay, setPasswordLengthDisplay] = useState("");
    const [savingText, setSavingText] = useState("");

    const updateEditorValues = async () => {
        if (!account || account === undefined) return;
        
        let decryptedPassword = await invoke("decrypt_password", { encryptedPassword: account.password });

        const service = document.getElementById("edit-service");
        const username = document.getElementById("edit-username");
        document.getElementById("edit-password").value = decryptedPassword;
        document.getElementById("edit-notes").value = account.notes;

        service.value = account.service;
        username.value = account.username;

        updateWarnStyle(service, username);
    }

    useEffect(() => {
        const updateValues = async () => {
            await updateEditorValues();
        }

        if (!loaded) return;

        updateValues();

        let passwordLength = document.getElementById("password-length");
        setRandomPassword(generatePassword(passwordLength.value));

        const loadLangText = async () => {
            if (addAccount)
                setTitle(getMsg(langFile, "AddEditAccount", "add_account.title"));
            else if (editAccount)
                setTitle(getMsg(langFile, "AddEditAccount", "edit_account.title"));
            setUsernamePlaceHld(getMsg(langFile, "AddEditAccount", "edit_username.placeholder"));
            setNotesPlaceHld(getMsg(langFile, "AddEditAccount", "edit_notes.placeholder"));
            setSaveButton(getMsg(langFile, "AddEditAccount", "save_button.text"));
            setCancelButton(getMsg(langFile, "AddEditAccount", "cancel_button.text"));
            setServiceTitle(getMsg(langFile, "AccountInfo", "service.title"));
            setUsernameTitle(getMsg(langFile, "AccountInfo", "username.title"));
            setPasswordTitle(getMsg(langFile, "AccountInfo", "password.title"));
            setNotesTitle(getMsg(langFile, "AccountInfo", "notes.title"));
            setNotificationPreviewTitle(getMsg(langFile, "AddEditAccount", "notification_preview.title"));
            setPasswordLengthDisplay(getMsg(langFile, "AddEditAccount", "password_length.display"));
            setSavingText(getMsg(langFile, "AddEditAccount", "save_button.saving"));
        }

        if (!langFile) return;
        loadLangText();
    }, [langFile, loaded]);

    const openAddAccount = async () => {
        document.getElementById("add-account-button");
        setAddAccount(true);
    }

    return (
        <div id="add-edit-account-main">
            <div id="add-account-space">
                <button id="add-account-button"
                 onClick={ async () => { openAddAccount() } }
                 style={{ display: isButtonVisible ? "block" : "none" }}></button>
            </div>

            <div id="add-edit-account-full-window">
                <div id="add-edit-account-blur"
                onClick={ () => { setAddAccount(false); setEditAccount(false) } }></div>

                <div id="add-edit-account">
                    <div id="title-bar">
                        <h1 id="add-edit-title">{title}</h1>
                    </div>

                    <p id="notification-preview-title" className="info-title">{notificationPreviewTitle}</p>
                    <Notification langFile={langFile} accounts={accounts} account={account} notificationId={"edit-account-notification"} setUpdatePassWarn={setUpdatePassWarn} />

                    <div id="edit-account-info">
                        <div id="edit-service-div">
                            <p id="service-title" className="info-title">{serviceTitle}</p>
                            <input type="text" autoComplete="off" id="edit-service" className="input-info" placeholder="Website[.com]" onChange={ () => updateAccount() } />
                        </div>

                        <div id="edit-username-div">
                            <p id="username-title" className="info-title">{usernameTitle}</p>
                            <input type="text" autoComplete="off" id="edit-username" className="input-info" placeholder={usernamePlaceHld} onChange={ () => updateAccount() } />
                        </div>

                        <div id="edit-password-div">
                            <p id="password-title" className="info-title">{passwordTitle}</p>
                            <div id="align-items">
                                <input type="text" autoComplete="off" id="edit-password" className="input-info" placeholder={randomPassword}
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
                            <input type="text" autoComplete="off" id="edit-notes" className="input-info safe-value" placeholder={notesPlaceHld} onChange={ () => updateAccount() } />
                        </div>

                        <div id="form-buttons">
                            <button id="save-account" className="fit-content"
                            onClick={ () => { applyAccount(); setShowAccountInfo(false) }}>{saveButton}</button>
                            <button id="cancel-operation" className="fit-content"
                            onClick={ () => { setAddAccount(false); setEditAccount(false) } }>{cancelButton}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AddEditAccount;

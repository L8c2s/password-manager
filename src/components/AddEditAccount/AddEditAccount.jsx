import { React, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";


import { getAccount, loadAccounts, saveAccounts, getDateTime, generatePassword } from "../Config/accountsManager/manager";

import { Notification } from "../notification/notification";

import { Automation } from "../../../tests/automate";


export function AddEditAccount({ langFile, accounts, setAccounts, editAccount, setEditAccount, addAccount, setAddAccount, selectedId, setShowAccountInfo, automation, setDisplayRestoreTip }) {
    const [loaded, setLoaded] = useState(false);
    const [account, setAccount] = useState({});
    const [randomPassword, setRandomPassword] = useState("");
    const [lastRandomUsed, setLastRandomUsed] = useState("");
    const [lengthNumber, setLengthNumber] = useState(12);
    const [accountIndex, setAccountIndex] = useState(-1);
    const [updatePassWarn, setUpdatePassWarn] = useState(false);
    const passwordLengthRef = useRef(null)

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

        document.getElementById("add-edit-password-input").value = randomPass;
        setRandomPassword(randomPass);
        setLastRandomUsed(randomPass);
    }

    const updateAccount = () => {
        const service = document.getElementById("add-edit-service-input");
        const username = document.getElementById("add-edit-username-input");
        const password = document.getElementById("add-edit-password-input");
        const notes = document.getElementById("add-edit-notes-input");
        
        updateWarnStyle(service, username);

        let updater = {...account};

        updater.service = service.value.trim();
        updater.username = username.value.trim();
        updater.password = password.value.trim();
        updater.notes = notes.value.trim();

        setAccount(updater);
    }

    const updateWarnStyle = (service, username) => {
        if (!loaded) return;

        let safeService = false;

        if (!service.value.trim()) {
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
        const exists = checkAccount(service.value.trim(), username.value.trim());
        if (!username.value.trim()) {
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
        if (!password) return;
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
        const displayLength = document.getElementById("password-length-display");
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

        if (!allAccounts[acc.service]) {
            allAccounts[acc.service] = [];
        }

        if (!acc.password_history) {
            acc.password_history = [];
        }

        acc.password_history.unshift({
            password: acc.password,
            added: acc.last_modified
        });

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
        setAccounts(await loadAccounts());
        setAddAccount(false);
        setDisplayRestoreTip(editAccount);
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
        if (automation) {
            automate();
        };
    }, []);

    useEffect(() => {
        const fullWindow = document.getElementById("add-edit-account");
        if (!fullWindow) return;

        const on = () => {
            fullWindow.style = "display: flex;";
            fullWindow.className = "zoom-in";
            const editService = document.getElementById("add-edit-service-input");
            if (!editService) return;
            editService.focus()
        }

        const off = () => {
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
        if (!account || !account.password) return;

        let decryptedPassword = await invoke("decrypt_password", { encryptedPassword: account.password });

        const service = document.getElementById("add-edit-service-input");
        const username = document.getElementById("add-edit-username-input");
        const editPassword = document.getElementById("add-edit-password-input");
        if (!editPassword) return;
        editPassword.value = decryptedPassword;
        const editNotes = document.getElementById("add-edit-notes-input");
        if (!editNotes) return;
        editNotes.value = account.notes;

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

        const passwordLength = document.getElementById("password-length");
        if (!passwordLength) return;
        setRandomPassword(generatePassword(passwordLength.value));

        if (addAccount)
            setTitle(langFile.titles.addAccount);
        else if (editAccount)
            setTitle(langFile.titles.editAccount);
        setUsernamePlaceHld(langFile.placeholders.editUsername);
        setNotesPlaceHld(langFile.placeholders.editNotes);
        setSaveButton(langFile.buttons.save);
        setCancelButton(langFile.buttons.cancel);
        setServiceTitle(langFile.titles.accountInfoService);
        setUsernameTitle(langFile.titles.accountInfoUsername);
        setPasswordTitle(langFile.titles.accountInfoPassword);
        setNotesTitle(langFile.titles.accountInfoNotes);
        setNotificationPreviewTitle(langFile.titles.notificationPreview);
        setPasswordLengthDisplay(langFile.messages.passwordLengthDisplay);
        setSavingText(langFile.buttons.save);
    }, [langFile, loaded]);

    return (
        <div id="add-edit-account">
            <div id="add-edit-account-blur" onClick={() => {
                setAddAccount(false);
                setEditAccount(false);
            }}></div>

            <div id="add-edit-account-div">
                <div id="add-edit-account-align">
                    <div id="add-edit-account-title-div">
                        <div id="add-edit-account-title-align">
                            <h1 id="add-edit-account-title">{title}</h1>
                        </div>
                    </div>

                    <div id="add-edit-account-notification-div">
                        <div id="add-edit-account-notification-align">
                            <Notification account={account} accounts={accounts} langFile={langFile} notificationId={"add-edit-account-notification"} setUpdatePassWarn={setUpdatePassWarn} />
                        </div>
                    </div>

                    <div id="add-edit-account-sec-div">
                        <div id="add-edit-account-sec-align">
                            <div id="add-edit-service-info" className="add-edit-info-div">
                                <div id="add-edit-service">
                                    <h4 id="add-edit-service-title" className="add-edit-account-info add-edit-account-info-title">{serviceTitle}</h4>

                                    <input type="text" id="add-edit-service-input" className="add-edit-account-input-info add-edit-account-info not-safe-value" placeholder="Website[.com]" autoComplete="off" onChange={ () => updateAccount() } />
                                </div>
                            </div>

                            <div id="add-edit-username-info" className="add-edit-info-div">
                                <div id="add-edit-username">
                                    <h4 id="add-edit-username-title" className="add-edit-account-info add-edit-account-info-title">{usernameTitle}</h4>

                                    <input type="text" id="add-edit-username-input" className="add-edit-account-input-info add-edit-account-info not-safe-value" placeholder={usernamePlaceHld} autoComplete="off" onChange={ () => updateAccount() } />
                                </div>
                            </div>

                            <div id="add-edit-password-info" className="add-edit-info-div">
                                <div id="add-edit-password">
                                    <div id="add-edit-password-sec">
                                        <h4 id="add-edit-password-title" className="add-edit-account-info add-edit-account-info-title">{passwordTitle}</h4>

                                        <input type="text" id="add-edit-password-input" className="add-edit-account-input-info add-edit-account-info no-value" placeholder={randomPassword} autoComplete="off" onChange={ () => updateAccount() } />
                                    </div>
                                </div>

                                <div id="add-edit-password-utils">
                                    <button id="generate-password" onClick={ () => {
                                        updateRandomPassword();
                                        updateAccount();
                                    } }></button>
                                </div>
                            </div>

                            <div id="add-edit-password-length-sec">
                                <input type="range" name="password-range" id="password-length" max={20} min={8} ref={passwordLengthRef} defaultValue={12}
                                 onChange={ e => {
                                    setLengthNumber(e.target.value);
                                    setRandomPassword(generatePassword(e.target.value));
                                } }
                                 onMouseOver={ () => enableLengthDisplay(true) } 
                                 onMouseOut={ () => enableLengthDisplay(false) } 
                                 autoComplete="off"/>

                                <p id="password-length-display" className="hide">{passwordLengthDisplay} {lengthNumber}</p>
                            </div>

                            <div id="add-edit-notes-info" className="add-edit-info-div">
                                <div id="add-edit-notes">
                                    <h4 id="add-edit-notes-title" className="add-edit-account-info add-edit-account-info-title">{notesTitle}</h4>

                                    <input type="text" id="add-edit-notes-input" className="add-edit-account-input-info add-edit-account-info safe-value" placeholder={notesPlaceHld} autoComplete="off" onChange={ () => updateAccount() } />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="add-edit-account-utils-div">
                        <div id="add-edit-account-utils-align">
                            <button id="save-account" onClick={ () => {
                                applyAccount();
                                setShowAccountInfo(false);
                            } } className="fit-content add-edit-account-utils">{saveButton}</button>

                            <button id="cancel-operation" onClick={ () => {
                                setAddAccount(false);
                                setEditAccount(false);
                            } } className="fit-content add-edit-account-utils">{cancelButton}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AddEditAccount;

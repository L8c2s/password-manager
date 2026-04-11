import { React, useEffect, useState } from "react";

import { getAccount } from "../Config/accountsManager/manager";

import { invoke } from "@tauri-apps/api/core";


export function History({ langFile, accounts, displayHistory, setDisplayHistory, selectedId }) {
    const [passwordHistory, setPasswordHistory] = useState([]);
    const [account, setAccount] = useState({});

    useEffect(() => {
        const turn = async () => {
            if (displayHistory && selectedId) {
                await getHistory();
            } else {
                setPasswordHistory([]);
            }
        }

        turn();
    }, [displayHistory]);

    const getDateAndTime = (timeZone) => {
        let [date, timeWithZone] = timeZone.split("T");

        let [year, month, day] = date.split("-");
        date = `${day}/${month}/${year}`;

        let time = timeWithZone.split(".")[0];

        return [date, time];
    }

    const getHistory = async () => {
        if (!selectedId) return;

        const acc = getAccount(accounts, selectedId);
        setAccount(acc);

        console.log(acc.password_history);

        let history = [];

        for (let i = 0; i < acc.password_history.length; i++) {
            const currentPass = acc.password_history[i];
            if (!currentPass.password) continue;

            let [date, time] = getDateAndTime(currentPass.added);

            history.push({
                password: await invoke("decrypt_password", { encryptedPassword: currentPass.password }),
                added: `${date} ${time}`
            });
        }

        setPasswordHistory(history);
    }

    const [passwordTimeout, setPasswordTimeout] = useState({});
    const [visiblePasswords, setVisiblePasswords] = useState({});

    const turnVisibility = (inputId) => {
        console.log(inputId);

        setVisiblePasswords(prev => ({...prev, [inputId]: true}));

        if (passwordTimeout[inputId]) {
            clearTimeout(passwordTimeout[inputId]);
        }

        const addTimeout = {...passwordTimeout};
        addTimeout[inputId] = setTimeout(() => {
            setVisiblePasswords(prev => ({...prev, [inputId]: false}));
        }, 1000);
        setPasswordTimeout(addTimeout);
    }

    const copyPassword = (inputId) => {
        const input = document.getElementById(inputId);
        navigator.clipboard.writeText(input.value);
    }

    const [historyTitle, setHistoryTitle] = useState("");
    const [passwordTitle, setPasswordTitle] = useState("");
    const [isCurrent, setIsCurrent] = useState("");

    useEffect(() => {
        setHistoryTitle(langFile.titles.passwordHistory);
        setPasswordTitle(langFile.messages.passwordAddedIn);
        setIsCurrent(langFile.messages.passwordCurrent);
    }, [langFile]);

    return (
        <div id="password-history-div" className={ (displayHistory && selectedId) ? "zoom-in" : "zoom-out" } style={{ display: (displayHistory && selectedId) ? "flex" : "none" }}>
            <div id="password-history-blur" onClick={ () => setDisplayHistory(false) }></div>

            <div id="password-history-window">
                <div id="password-history-align-div">
                    <div id="password-history-header">
                        <div id="password-history-title-align">
                            <h1 id="password-history-title">{historyTitle}</h1>
                        </div>
                    </div>

                    <div id="password-history-account-info">
                        <div id="password-history-info-align">
                            <div id="password-history-account-data">
                                <h3 id="history-account-info-service" className="history-account-info">{account && account.service}</h3>

                                <p id="history-account-info-username" className="history-account-info">{account && account.username}</p>
                            </div>
                        </div>
                    </div>

                    <div id="password-history-list-div">
                        <div id="password-history-list-align">
                            {passwordHistory.map((password, index) => (
                                <div className="password-history-item" key={password.added}>
                                    <div className="password-history-item-info">
                                        <p className="history-password-title">{passwordTitle} {password.added} {index === 0 ? isCurrent : null}</p>

                                        <input type={visiblePasswords[password.added.replace(" ", "-")] ? "text" : "password"} name="password-from-history" id={password.added.replace(" ", "-")} className="password-history-input" placeholder="Account Password" readOnly value={password.password} />
                                    </div>

                                    <div className="password-history-item-utils">
                                        <button className={`display-password ${visiblePasswords[password.added.replace(" ", "-")] ? "password-visibility-on" : "password-visibility-off"}`} onClick={ () => turnVisibility(password.added.replace(" ", "-")) }></button>

                                        <button className="copy-password-history" onClick={ () => copyPassword(password.added.replace(" ", "-")) }></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

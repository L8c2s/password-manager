import { React, useEffect, useState } from "react";
import "./PasswordHistory.css";

import { findCorrectLeft } from "../Config/config";
import { getAccount } from "../Config/accountsManager/manager";

import { invoke } from "@tauri-apps/api/core";
import { getMsg } from "../Config/lang";

export function History({ langFile, accounts, displayHistory, setDisplayHistory, selectedId }) {
    const [passwordHistory, setPasswordHistory] = useState([]);

    useEffect(() => {
        const turn = async () => {
            if (displayHistory && selectedId) {
                historyOn();
                await getHistory();
            } else {
                historyOff();
                setPasswordHistory([]);
            }
        }

        turn();
    }, [displayHistory]);

    useEffect(() => {
        
    }, [passwordHistory]);

    const historyOn = () => {
        const fullWindow = document.getElementById("history-full-window");
        fullWindow.style.display = "block";
        fullWindow.className = "zoom-in";
        correctLeft(null);
    }

    const historyOff = () => {
        const fullWindow = document.getElementById("history-full-window");
        fullWindow.className = "zoom-out";
    }

    const getHistory = async () => {
        if (!selectedId) return;
        
        const account = getAccount(accounts, selectedId);
        let history = [];

        for (let i = 0; i < account.password_history.length; i++) {
            const currentPass = account.password_history[i];
            if (!currentPass.password) continue;

            let addedDate = currentPass.added;
            let [date, timeWithZone] = addedDate.split("T");

            let [year, month, day] = date.split("-");
            date = `${day}/${month}/${year}`;
            
            let time = timeWithZone.split(".")[0];

            history.push({
                password: await invoke("decrypt_password", { encryptedPassword: currentPass.password }),
                added: `${date} ${time}`
            });
        }

        setPasswordHistory(history);
    }

    const [passwordTimeout, setPasswordTimeout] = useState({});

    const turnVisibility = (inputId) => {
        const input = document.getElementById(inputId);
        input.type = "text";

        const vision = document.getElementById(`${inputId}vision`);
        vision.classList.remove("password-visibility-off");
        vision.classList.add("password-visibility-on");

        if (passwordTimeout) {
            clearTimeout(passwordTimeout[inputId]);
        }

        let addTimeout = {...passwordTimeout};
        addTimeout[inputId] = setTimeout(() => {
            input.type = "password"
            vision.classList.remove("password-visibility-on");
            vision.classList.add("password-visibility-off");
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
        setHistoryTitle(getMsg(langFile, "PasswordHistory", ".title"));
        setPasswordTitle(getMsg(langFile, "PasswordHistory", "password.added_in"));
        setIsCurrent(getMsg(langFile, "PasswordHistory", "password.current"));
    }, [langFile]);

    const correctLeft = (e) => {
        findCorrectLeft(document.getElementById("history-window"));
    }
    window.addEventListener("resize", correctLeft);

    return (
        <div id="history-full-window">
            <div id="history-blur" onClick={
                () => { setDisplayHistory(false) }
            }></div>

            <div id="history-window">
                <div id="history-header">
                    <h1 id="history-title">{historyTitle}</h1>
                </div>

                <div id="history-display">
                    {passwordHistory.map((password, index) => (
                        <div className="password-history-item" key={password.added}>
                            <p className="password-history-title">{passwordTitle} {password.added} {index === 0 ? isCurrent : null}</p>
                            <input type="password" className="password-history-input" id={password.added} value={password.password} readOnly />
                            <button id={`${password.added}vision`} className="display-password password-visibility-off" onClick={ () => turnVisibility(password.added, index) }></button>
                            <button className="copy-password-history" onClick={ () => copyPassword(password.added) }></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

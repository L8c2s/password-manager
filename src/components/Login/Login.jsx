import { React, useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { appDataDir } from "@tauri-apps/api/path";
import "./Login.css";

import { getMsg } from "../Config/lang";
import { getConfigValue, findCorrectLeft } from "../Config/config";


export function Login({ langFile, setLoginSuccess }) {
    // login page for the user to create a password for the program
    // to encrypt and decrypt all their passwords

    // if it is the first time entering the program, the password will be saved
    // in a file with all what is needed to decrypt the passwords

    // if it is not the first time of the user in the program, the password
    // will be sent to rust and compared with the hash saved, if it is not equal
    // the access is not granted, else the access is granted.

    const [firstTime, setFirstTime] = useState(true);
    const password = useRef(null);

    useEffect(() => {
        const checkFirstTime = async () => {
            let password_hash = await getConfigValue("password_hash");
            if (!password_hash) {
                setFirstTime(true)
                return;
            };

            setFirstTime(false);
        }

        checkFirstTime();
    }, []);

    useEffect(() => {
        const tip01 = document.getElementById("secure-password-tips-01");

        if (!firstTime) {
            tip01.style.display = "none";
        } else {
            tip01.style.display = "block";
        }

        // console.log(firstTime);
    }, [firstTime]);

    const submitPassword = async () => {
        let submitButton = document.getElementById("submit-password");
        let userPassword = password.current.value;
        if (!userPassword) return;

        let configDirectory = await appDataDir() + "/config.json";

        setSubmitText(getMsg(langFile, "Login", "login.verifying"));
        submitButton.setAttribute("disabled", "true");

        // console.log(`receive_user_password arguments: ${userPassword}, ${firstTime}, ${configDirectory}`);
        invoke("receive_user_password", { userPassword: userPassword, firstTime: firstTime, configDirectory: configDirectory }).then(
            (success) => {
                // console.log("success: ", success);
                if (success) {
                    setSecureTip00(getMsg(langFile, "Login", "login.success"));
                    password.current.className = "correct-password";
                } else {
                    password.current.className = "wrong-password";
                }

                setLoginSuccess(success);
                setSubmitText(getMsg(langFile, "Login", "login.submit"));
                submitButton.removeAttribute("disabled");
            }
        );
    }

    const [loginTitle, setLoginTitle] = useState("");
    const [loginPasswordPlhd, setLoginPasswordPlhd] = useState("");
    const [submitText, setSubmitText] = useState("");
    const [secureTip00, setSecureTip00] = useState("");
    const [secureTip01, setSecureTip01] = useState("");

    useEffect(() => {
        setLoginTitle(getMsg(langFile, "Login", ".title"));
        setLoginPasswordPlhd(getMsg(langFile, "Login", "login_password.placeholder"));
        setSubmitText(getMsg(langFile, "Login", "login.submit"));

        if (firstTime) {
            setSecureTip00(getMsg(langFile, "Login", "login.tip00"));
            setSecureTip01(getMsg(langFile, "Login", "login.tip01"));
        } else {
            setSecureTip00(getMsg(langFile, "Login", "login.tip02"));
        }
    }, [langFile, firstTime]);

    const correctLeft = (e) => {
        findCorrectLeft(document.getElementById("login-page"));
    }
    // window.addEventListener("resize", correctLeft);
    // correctLeft(null);
    
    return (
        <div id="login-page">
            <h1 id="login-title">{loginTitle}</h1>
            <input type="password" autoComplete="off" className="idle" ref={password} id="login-password" placeholder={loginPasswordPlhd} autoFocus onChange={ () => {
                if (!password.current.value) password.current.className = "idle";
            } } />
            <button id="submit-password" onClick={ () => { submitPassword() } }>{submitText}</button>

            <p id="secure-password-tips-00" className="tips">{secureTip00}</p>
            <p id="secure-password-tips-01" className="tips">{secureTip01}</p>
        </div>
    );
}

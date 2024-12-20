
import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

import { checkConfig, saveConfig } from "../Config/config";


export function Login({ langFile, setLoginSuccess, config }) {
    const [firstTime, setFirstTime] = useState(true);
    const password = useRef(null);

    useEffect(() => {
        // checks if the user has a password hash saved already
        // if true, it's not the user's first time using the app
        setFirstTime(!config.password_hash ? true : false);
    }, []);

    const submitPassword = async () => {
        // sends the password to the backend to be verified

        let submitButton = document.getElementById("submit-password");
        let userPassword = password.current.value;
        if (!userPassword) return;

        setSubmitText(langFile.messages.verifying);
        submitButton.setAttribute("disabled", "true");

        await invoke("receive_user_password", { userPassword: userPassword, firstTime: firstTime, config: JSON.stringify(config) })
            .then(async (newConfig) => {
                // receives feedback from the backend
                // if it is false, then the password is not equal to the hash saved
                // if it is a string of the config, then the password is equal to the hash or it's a new password

                if (newConfig !== "false") {
                    setSubmitText(langFile.messages.success);
                    password.current.className = "correct-password";

                    // fixes config if anything is wrong and let the user continue
                    const config = checkConfig(JSON.parse(newConfig));
                    setLoginSuccess(true);
                    await saveConfig(config, "login");
                } else {
                    password.current.className = "wrong-password";
                    setSubmitText(langFile.messages.wrongPassword);

                    setLoginSuccess(false);
                }

                submitButton.removeAttribute("disabled");
            });
    }

    const [loginPasswordPlhd, setLoginPasswordPlhd] = useState("");
    const [secureTip0, setSecureTip00] = useState("");
    const [secureTip1, setSecureTip01] = useState("");
    const [loginTitle, setLoginTitle] = useState("");
    const [submitText, setSubmitText] = useState("");

    useEffect(() => {
        setLoginTitle(langFile.titles.login);
        setLoginPasswordPlhd(langFile.placeholders.loginPassword);
        setSubmitText(langFile.buttons.loginSubmit);

        if (firstTime) {
            setSecureTip00(langFile.messages.loginTip0);
            setSecureTip01(langFile.messages.loginTip1);
        } else {
            setSecureTip00(langFile.messages.loginTip2);
        }

    }, [langFile, firstTime]);

    return (
        <div id="full-login-page">
            <div id="top-div-dummy"></div>

            <div id="login-page">
                <div id="login-title-div">
                    <h1 id="login-title">{loginTitle}</h1>
                </div>

                <div id="login-input-div">
                    <input type="password" name="user-password" autoComplete="off" className="idle" ref={password} placeholder={loginPasswordPlhd} id="login-password" autoFocus onChange={ () => {
                        if (!password.current.value) password.current.className = "idle";
                    } } />

                    <button id="submit-password" className="fit-content" onClick={ submitPassword }></button>
                </div>

                <div id="login-tips-div">
                    <p id="secure-password-tips-00" className="tips">{secureTip0}</p>
                    { firstTime && (<p id="secure-password-tips-01" className="tips">{secureTip1}</p>) }
                </div>
            </div>
        </div>
    );
}

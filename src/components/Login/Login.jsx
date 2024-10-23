import { React, useEffect, useState } from "react";
import "./Login.css";

import { getMsg } from "../Config/lang";


export function Login({ langFile, setLoginSuccess }) {
    // login page for the user to create a password for the program
    // to encrypt and decrypt all their passwords

    // if it is the first time entering the program, the password will be saved
    // in a file with all what is needed to decrypt the passwords

    // if it is not the first time of the user in the program, the password
    // will be sent to rust and compared with the hash saved, if it is not equal
    // the access is not granted, else the access is granted.

    const [loginTitle, setLoginTitle] = useState("");

    useEffect(() => {
        setLoginTitle()
    }, []);

    return (
        <div id="login-page">
            <h1 id="login-title">Bem-vindo</h1>
            <input type="text" id="login-password" placeholder="Esta será a única senha que você precisará se lembrar :)" />
            <button id="submit-password">Continuar</button>

            <p id="secure-password-tips">Digite uma senha que não seja difícil de lembrar, mas que seja segura para proteger todas as suas contas.</p>
        </div>
    );
}

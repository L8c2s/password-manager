import React from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { writeTextFile, readTextFile } from "@tauri-apps/api/fs";
import "./App.css";


function isPasswordSafe(password) {
  let symbols = [];
  for (let i = 33; i <= 47; i++) {
    symbols.push(String.fromCharCode(i));
  }
  for (let i = 58; i <= 64; i++) {
    symbols.push(String.fromCharCode(i));
  }
  for (let i = 91; i <= 96; i++) {
    symbols.push(String.fromCharCode(i));
  }
  for (let i = 123; i <= 126; i++) {
    symbols.push(String.fromCharCode(i));
  }

  symbols = symbols.join("")

  if (password.length < 8) {
    console.log("password length")
    return false;
  }

  // check for at least one digit
  if (!/\d/.test(password)) {
    console.log("no digits")
    return false;
  }

  if (!/[a-z]/.test(password)) {
    console.log("no smol alphabet")
    if (!/[A-Z]/.test(password)) {
      console.log("no big alphabet")
      return false;
    }
  }

  if (!/[!@#$%^&*()-_=+{}[\]|;:'",.<>?]/.test(password)) {
    console.log("none of the symbols: !\"#$%&'()*+,-./:;<=>?@[\]^_`{|}~")
    return false;
  }

  return true;
}


function checkInfo (service, username, password) {
  if (service.length == 0) return false
  if (username.length == 0) return false
  if (password.length == 0) return false

  if (!isPasswordSafe(password)) {
    document.getElementById("not-safe-password").innerHTML = "The password may not be safe enough."
  }
  return true
}

// file functions

const saveAccount = async () => {
  const service = document.getElementById("service").value;
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const notes = document.getElementById("notes").value;

  if (!checkInfo(service, username, password)) return false

  let json_string = await invoke("serialize", { service: service, username: username, password: password, notes: notes });
  await writeTextFile("C:/Users/luhlu/Documents/passwords/tests/accounts.json", json_string);
}

const readAccounts = async () => {
  let accounts = await readTextFile("C:/Users/luhlu/Documents/passwords/tests/accounts.json")
  let allaccounts = await invoke("deserialize", { accounts: accounts });
  return allaccounts
}

// input functions

const generatePassword = () => {
  let lowercase = [];
  for (let i = 97; i <= 122; i++) {
    lowercase.push(String.fromCharCode(i));
  }

  let uppercase = [];
  for (let i = 65; i <= 90; i++) {
    uppercase.push(String.fromCharCode(i));
  }

  let digits = [];
  for (let i = 48; i <= 57; i++) {
    digits.push(String.fromCharCode(i));
  }

  let symbols = [];
  for (let i = 33; i <= 47; i++) {
    symbols.push(String.fromCharCode(i));
  }
  for (let i = 58; i <= 64; i++) {
    symbols.push(String.fromCharCode(i));
  }
  for (let i = 91; i <= 96; i++) {
    symbols.push(String.fromCharCode(i));
  }
  for (let i = 123; i <= 126; i++) {
    symbols.push(String.fromCharCode(i));
  }

  let chars = lowercase.join("") + uppercase.join("") + digits.join("") + symbols.join("");
  console.log(chars)

  let length = document.getElementById("password-length").value;

  let password = [];
  for (let i = 0; i <= length - 1; i++) {
    password.push(chars.charAt(Math.floor(Math.random() * chars.length)));
  }

  document.getElementById("password").value = password.join("");
  document.getElementById("not-safe-password").innerHTML = "";
}

const updateRange = () => {
  let length = document.getElementById("password-length").value;
  document.getElementById("show-length").innerHTML = "Length: " + length;
}

function updateSafePassErr () {
  let password = document.getElementById("password").value;
  if (!isPasswordSafe(password)) {
    document.getElementById("not-safe-password").innerHTML = "The password may not be safe enough."
  } else {
    document.getElementById("not-safe-password").innerHTML = "";
  }
}

const clear = () => {
  let length = document.getElementById("password-length").value;
  document.getElementById("create-account").querySelectorAll("input").forEach(input => {
    input.value = "";
  });

  document.getElementById("password-length").value = length;
  document.getElementById("not-safe-password").innerHTML = "";
}

function App() {
  return (
    <div className="container">
      <div className="display" id="account-info">
        <button id="get-info" onClick={readAccounts}>Read</button>
      </div>

      <div className="display" id="accounts-list"></div>

      <div className="display" id="create-account">
        <h3 id="create-account-title">New Account</h3>

        <div id="form">
          <p id="get-service">Service name</p>
          <input type="text" placeholder="Service" id="service" />

          <p id="get-username">Username/Email</p>
          <input type="text" placeholder="example@abc.com" id="username" />

          <p id="get-password">Password</p>
          <input type="text" onChange={updateSafePassErr} placeholder="Password" id="password" />
          <button id="generate" onClick={generatePassword}>Generate</button>
          <p id="not-safe-password"></p>
          <input onChange={updateRange} type="range" name="Length" id="password-length" min={8} max={20} defaultValue={12} />
          <p id="show-length">Length: 12</p>

          <p id="get-notes">Notes/Observations</p>
          <input type="text" placeholder="Optional" id="notes" />
        </div>

        <div id="options">
          <button id="save" onClick={saveAccount}>Save</button>
          <button id="cancel" onClick={clear}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default App;

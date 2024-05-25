import React from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { writeTextFile, readTextFile } from "@tauri-apps/api/fs";
import "./App.css";


let accountsListed = [];

// check account info

// optimized
const isPasswordSafe = (password) => {
  if (password.length < 8) return false;
  if (!/\d/.test(password)) return false;
  if (!/[a-z]/.test(password)) {
    if (!/[A-Z]/.test(password)) return false;
  };
  
  const specialChars = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
  if (!new RegExp(`[${specialChars}]`).test(password)) return false;

  return true;
}

// optimized
const checkInfo = (service, username, password) => {
  if (service.length == 0) return false
  if (username.length == 0) return false
  if (password.length == 0) return false

  if (!isPasswordSafe(password)) {
    document.getElementById("not-safe-password").innerHTML = "The password may not be safe enough."
  }
  return true
}

// file functions

const editAccount = () => {
  document.getElementById("create-account-title").innerHTML = "New Account";
  document.getElementById("save").removeAttribute("hidden");
}

const deleteAccount = () => {
  document.getElementById("create-account-title").innerHTML = "New Account";
}

// optimized
const saveAccount = async () => {
  const service = document.getElementById("service").value;
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const notes = document.getElementById("notes").value;

  if (!checkInfo(service, username, password)) return false;

  let accounts = await readAccounts();
  if (!accounts.hasOwnProperty(service)) {
    accounts[service] = []
  }

  const existingAccount = accounts[service].find(account => account.username === username);
  if (existingAccount) {
    document.getElementById("account-already-exists").innerHTML = "The account already exists.";
    return;
  }

  let newId = generatePassword(6);
  let new_account = {
    "service": service,
    "username": username,
    "password": password,
    "notes": notes,
    "password-history": [password],
    "favorite": false,
    "id": newId
  }
  accounts[service].push(new_account);

  let json_string = JSON.stringify(accounts);
  await writeTextFile("C:/Users/luhlu/Documents/passwords/tests/accounts.json", json_string);
  await updateAccountsList();
  usedIds(new_account["id"]);

  document.getElementById("create-account-title").innerHTML = "New Account";
  document.getElementById("account-already-exists").innerHTML = "";
  document.getElementById("edit").setAttribute("hidden", "true")
  document.getElementById("delete").setAttribute("hidden", "true")
}

const checkId = async (id) => {
  let allIds = await readTextFile("C:/Users/luhlu/Documents/passwords/ids.json");
  allIds = JSON.parse(allIds);

  for (let i = 0; i < allIds.length; i++) {
    if (allIds[i] == id) {
      return true;
    }
  }
  return false;
}

// optimized
const usedIds = async (id) => {
  const idsFilePath = "C:/Users/luhlu/Documents/passwords/ids.json"

  let allIds = JSON.parse(await readTextFile(idsFilePath));
  allIds.push(id);
  
  allIds = JSON.stringify(allIds);
  await writeTextFile(idsFilePath, allIds);
}

// optimized
const readAccounts = async () => {
  const accountsPath = "C:/Users/luhlu/Documents/passwords/tests/accounts.json";
  return JSON.parse(await readTextFile(accountsPath));
}

// input functions

// optimized
const getPassword = () => {
  document.getElementById("password").value = generatePassword();
  document.getElementById("not-safe-password").innerHTML = "";
}

// optimized
const generatePassword = (length=0) => {
  const chars = "abcdefghijklmnopqrstuvwxyz" +
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
    "0123456789" +
    "/* !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~ */"

  if (length == 0) {
    length = document.getElementById("password-length").value;
  }

  let password = "";
  for (let i = 0; i <= length - 1; i++) {
    const index = Math.floor(Math.random() * chars.length);
    password += chars[index];
  }

  let symbols = "!\"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~"

  let lower = /[a-z]/g.test(password);
  let upper = /[A-Z]/g.test(password);
  let number = /[0-9]/g.test(password);
  let symbol = new RegExp(`[${symbols}]`).test(password);

  if (lower && upper && number && symbol) {
    return password;
  }
  
  return generatePassword(length);
}

/* !"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~ */

// optimized
const updateRange = () => {
  let length = document.getElementById("password-length").value;
  document.getElementById("show-length").textContent = `Length ${length}`;
}

// optimized
const updateSafePassErr = () => {
  const password = document.getElementById("password").value;
  const isSafe = isPasswordSafe(password);
  document.getElementById("not-safe-password").textContent = isSafe ? "" : 
    "The password may not be safe enough.";
}

// optimized
const clear = () => {
  const length = document.getElementById("password-length").value;
  const inputs = document.getElementById("create-account").querySelectorAll("input");
  inputs.forEach(input => input.value = "");
  
  document.getElementById("create-account-title").innerHTML = "New Account";
  document.getElementById("password-length").value = length;
  document.getElementById("not-safe-password").innerHTML = "";
  document.getElementById("edit").setAttribute("hidden", "true")
  document.getElementById("delete").setAttribute("hidden", "true")
  document.getElementById("save").removeAttribute("hidden")
}

// accounts list

const createItem = (accountInfo) => {
  let list = document.getElementById("list");

  let div_accounts_list_item = document.createElement("div");
  div_accounts_list_item.setAttribute("class", "accounts-list-item");
  
  let div_account_info = document.createElement("div");
  div_account_info.setAttribute("class", "account-info");
  div_account_info.addEventListener("click", () => itemOnClick(accountInfo["service"], accountInfo["id"]));

  let p_service = document.createElement("p");
  p_service.setAttribute("class", "service");
  p_service.innerHTML = accountInfo["service"]

  let p_username = document.createElement("p");
  p_username.setAttribute("class", "username");
  p_username.innerHTML = accountInfo["username"]

  let div_icon_container = document.createElement("div");
  div_icon_container.setAttribute("class", "icon-container");
  div_icon_container.setAttribute("id", accountInfo["id"]);

  let div_icon_button = document.createElement("div");
  div_icon_button.setAttribute("class", "icon-button");
  div_icon_button.setAttribute("id", "favorite-icon");

  let svg_fav_icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg_fav_icon.addEventListener("click", () => favOnClick(accountInfo["id"]));
  svg_fav_icon.addEventListener("mouseover", () => favOnMouseOver(accountInfo["id"]+"_path"));
  svg_fav_icon.addEventListener("mouseout", () => favOnMouseOut(accountInfo["id"]));
  svg_fav_icon.setAttribute("id", accountInfo["id"]+"_svg");
  svg_fav_icon.setAttribute("class", "not-favorite");
  svg_fav_icon.setAttribute("width", "23px");
  svg_fav_icon.setAttribute("height", "23px");
  svg_fav_icon.setAttribute("viewBox", "0 -1 1024 1024");
  svg_fav_icon.setAttribute("version", "1.1");
  // svg_fav_icon.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg_fav_icon.setAttribute("fill", "#0000000")

  let g_SVGRepo_bgCarrier = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g_SVGRepo_bgCarrier.setAttribute("id", "SVGRepo_bgCarrier");
  g_SVGRepo_bgCarrier.setAttribute("strokeWidth", "0")
  
  let g_SVGRepo_tracerCarrier = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g_SVGRepo_tracerCarrier.setAttribute("id", "SVGRepo_tracerCarrier");
  g_SVGRepo_tracerCarrier.setAttribute("strokeLinecap", "round");
  g_SVGRepo_tracerCarrier.setAttribute("strokeLinejoin", "round");

  let SVGRepo_iconCarrier = document.createElementNS("http://www.w3.org/2000/svg", "g");
  SVGRepo_iconCarrier.setAttribute("id", "SVGRepo_iconCarrier");

  let favPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  favPath.setAttribute("id", accountInfo["id"]+"_path");
  favPath.setAttribute("d", "M802.4 967.2c-7.2 0-15.2-1.6-21.6-4.8l-258.4-128.8-252.8 140c-18.4 10.4-41.6 5.6-56-9.6-8.8-9.6-12.8-23.2-11.2-36.8l43.2-285.6L33.6 444C20.8 432 16 414.4 21.6 397.6c4.8-16.8 18.4-28.8 36-31.2l285.6-48L464.8 56c7.2-15.2 22.4-25.6 39.2-26.4 17.6-0.8 33.6 8.8 41.6 24l133.6 256.8 287.2 35.2c17.6 2.4 31.2 13.6 36.8 30.4 5.6 16 1.6 34.4-10.4 46.4L790.4 629.6l55.2 284c2.4 12.8-0.8 26.4-8.8 36.8-8.8 10.4-21.6 16.8-34.4 16.8zM520.8 784.8c7.2 0 15.2 1.6 21.6 4.8l255.2 127.2-54.4-280c-3.2-14.4 1.6-29.6 12-40l200-203.2L672 358.4c-14.4-1.6-28-11.2-34.4-24L506.4 81.6 385.6 340c-6.4 13.6-19.2 23.2-33.6 25.6L70.4 412l208 194.4c11.2 10.4 16 24.8 13.6 40L249.6 928l249.6-137.6c7.2-3.2 14.4-4.8 21.6-5.6z")
  favPath.setAttribute("fill", "#000000")
  
  svg_fav_icon.appendChild(g_SVGRepo_bgCarrier);
  svg_fav_icon.appendChild(g_SVGRepo_tracerCarrier);
  SVGRepo_iconCarrier.appendChild(favPath);
  svg_fav_icon.appendChild(SVGRepo_iconCarrier);
  div_icon_button.appendChild(svg_fav_icon);
  div_icon_container.appendChild(div_icon_button);
  div_account_info.appendChild(p_service);
  div_account_info.appendChild(p_username);
  div_accounts_list_item.appendChild(div_account_info);
  div_accounts_list_item.appendChild(div_icon_container);
  list.appendChild(div_accounts_list_item);
}

const getFilter = () => {
  let filter = document.getElementById("filter").value;
  if (filter === "") {
    filter = null
  }
  updateAccountsList(filter);
}

const updateAccountsList = async (filter=null) => {
  let accounts = await readAccounts();

  let list = document.getElementById("list");
  list.innerHTML = "";

  const accountsListed = [];

  Object.entries(accounts).forEach(([service, accountList]) => {
    accountList.forEach((account) => {
      if (filter != null && !service.toLowerCase().includes(filter.toLowerCase())) return;
      if (!accountsListed.includes(account["id"])) {
        createItem(account);
        accountsListed.push(account["id"]);
      }
    });
  });
}

// list item functions

const copyOnMouseOver = () => {
  document.getElementById("cpy-icon").setAttribute("fill", "#396cd8");
}

const copyOnMouseOut = () => {
  document.getElementById("cpy-icon").setAttribute("fill", "#000000");
}

const favOnMouseOver = (id) => {
  document.getElementById(id).setAttribute("fill", "#ffff00");
}

const favOnMouseOut = (id) => {
  let fav_icon = document.getElementById(id+"_svg");
  if (fav_icon.getAttribute("class") == "favorite") return;
  document.getElementById(id+"_path").setAttribute("fill", "#000000");
}

const favOnClick = async (id) => {
  const fav_icon = document.getElementById(id+"_svg")
  const fav_path = document.getElementById(id+"_path")

  const accounts = await readAccounts();
  let serviceName = "";
  let listIndex = 0;

  for (let [services, accountsList] of Object.entries(accounts)) {
    for (let [index, accountInfo] of accountsList.entries()) {
      if (accountInfo.id === id) {
        serviceName = services;
        listIndex = index;
        break;
      }
    }
  }

  let saved = fav_icon.getAttribute("class")
  if (saved == "favorite") {
    fav_path.setAttribute("fill", "#000000")
    fav_icon.setAttribute("class", "not-favorite")

    accounts[serviceName][listIndex]["favorite"] = false;
  } else if (saved == "not-favorite") {
    fav_path.setAttribute("fill", "#ffff00")
    fav_icon.setAttribute("class", "favorite")

    accounts[serviceName][listIndex]["favorite"] = true;
  }

  let json_string = JSON.stringify(accounts);
  await writeTextFile("C:/Users/luhlu/Documents/passwords/tests/accounts.json", json_string);
}

const itemOnClick = async (service, itemId) => {
  document.getElementById("create-account-title").innerHTML = "Edit Account";
  document.getElementById("save").setAttribute("hidden", "true");

  let accounts = await readAccounts();
  let currentService = "";
  let currentIndex = 0;

  for (let [svc, accountList] of Object.entries(accounts)) {
    for (let [index, account] of accountList.entries()) {
      if (svc == service && account["id"] == itemId) {
        currentIndex = index;
        currentService = service;
        break;
      }
    }
  }

  if (currentService === 0) {
    return false
  }

  document.getElementById("service").value = accounts[currentService][currentIndex]["service"]
  document.getElementById("username").value = accounts[currentService][currentIndex]["username"]
  document.getElementById("password").value = accounts[currentService][currentIndex]["password"]
  document.getElementById("notes").value = accounts[currentService][currentIndex]["notes"]

  document.getElementById("edit").removeAttribute("hidden")
  document.getElementById("delete").removeAttribute("hidden")
}

const copy = async (itemId) => {
  let accounts = await readAccounts();
  let currentAccount;

  for (let [_, accountList] of Object.entries(accounts)) {
    for (let [_, account] of accountList.entries()) {
      if (account["id"] == itemId) {
        currentAccount = account;
        break;
      }
    }
  }

  if (!currentAccount) return false;

  const password = currentAccount["password"];
  navigator.clipboard.writeText(password);
}

window.addEventListener("load", () => {
  updateAccountsList();
})

function App() {
  return (
    <div className="container">
      <div className="display" id="account-info">
        <h3 className="title" id="account-info-title">Account Info</h3>
      </div>

      <div className="display" id="accounts-list">
        <h3 className="title" id="accounts-list-title">Accounts List</h3>

        <div id="test">
          <input type="text" placeholder="Type a service to filter" id="filter" onChange={getFilter} />
        </div>

        <ul id="list"></ul>
      </div>

      <div className="display" id="create-account">
        <h3 className="title" id="create-account-title">New Account</h3>

        <div id="form">
          <p id="get-service">Service name</p>
          <input type="text" placeholder="Service" id="service" />

          <p id="get-username">Username/Email</p>
          <input onChange={() => { document.getElementById("account-already-exists").innerHTML = "" }}
           type="text" placeholder="example@abc.com" id="username" />
          <p id="account-already-exists" className="error-message"></p>

          <p id="get-password">Password</p>
          <input type="text" onChange={updateSafePassErr} placeholder="Password" id="password" />

          <button id="generate" onClick={getPassword}>Generate</button>
          <p id="not-safe-password" className="error-message"></p>

          <input onChange={updateRange} type="range" name="Length" id="password-length" min={8} max={20} defaultValue={12} />
          <p id="show-length">Length: 12</p>

          <p id="get-notes">Notes/Observations</p>
          <input type="text" placeholder="Optional" id="notes" />
        </div>

        <div id="options">
          <button id="save" onClick={saveAccount}>Save</button>
          <button id="edit" onClick={editAccount} hidden>Edit</button>
          <button id="delete" onClick={deleteAccount} hidden>Delete</button>
          <button id="cancel" onClick={clear}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default App;

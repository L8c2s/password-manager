import React from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { writeTextFile, readTextFile, exists, createDir, copyFile } from "@tauri-apps/api/fs";
import { open } from "@tauri-apps/api/dialog";
import { appConfigDir } from "@tauri-apps/api/path";
import "./App.css";

let lastClickedId;

let mainPath = "";
let jsonAccountsPath = "";
let textAccountsPath = "";
let idsPath = "";

// # file related

const createTextFile = async () => {
  const accounts = await readAccounts();

  const formattedData = Object.entries(accounts).map(([service, accountsList]) => {
    const accountInfo = accountsList.map((account) => {
      const { service, username, password, notes, password_history, favorite, id } = account;
      let infoString = `  username: ${username}\n  password: ${password}`;
      if (notes) {
        infoString += `\n  notes: ${notes}`
      }
      return infoString;
    }).join("\n\n");
    return `${service.toUpperCase()}\n${accountInfo}`;
  }).join("\n\n")

  await writeTextFile(textAccountsPath, formattedData);
}

// ## paths related

const createBackup = async () => {
  if (!mainPath || !jsonAccountsPath || !textAccountsPath || !idsPath) return false;

  let date = new Date();

  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();

  if (month < 10) month = `0${month}`;
  if (day < 10) day = `0${day}`;

  let hour = date.getHours();
  let minute = date.getMinutes();
  let second = date.getSeconds();

  if (hour < 10) hour = `0${hour}`;
  if (minute < 10) minute = `0${minute}`;
  if (second < 10) second = `0${second}`;

  let dirName = `${year}${month}${day}-${hour}${minute}${second}`;
  let backupPath = `${mainPath}\\backup\\${dirName}`;

  if (!await exists(`${mainPath}\\backup`)) {
    await createDir(`${mainPath}\\backup`);
  }

  await createDir(backupPath);
  await copyFile(jsonAccountsPath, `${backupPath}\\accounts.json`);
  await copyFile(textAccountsPath, `${backupPath}\\accounts.txt`);
  await copyFile(idsPath, `${backupPath}\\ids.json`);
}

const createFile = async (file) => {

  let content = "";
  let path = textAccountsPath;

  if (file === "json") {
    content = JSON.stringify({});
    path = jsonAccountsPath;
  } else if (file === "ids") {
    content = JSON.stringify([]);
    path = idsPath;
  }

  await writeTextFile(path, content);
}

const checkPath = async () => {
  if (!jsonAccountsPath || !textAccountsPath || !idsPath) return false;

  const json_exists = await exists(jsonAccountsPath);
  const text_exists = await exists(textAccountsPath);
  const ids_exists = await exists(idsPath);

  if (!json_exists) {
    createFile("json");
  }

  if (!text_exists) {
    createFile("text");
  }

  if (!ids_exists) {
    createFile("ids");
  }

  const accounts = await readAccounts();
  if (Object.prototype.toString.call(accounts) !== "[object Object]") {
    await saveAccounts({});
  }

  const ids = await readIds(idsPath);
  if (Object.prototype.toString.call(ids) !== "[object Array]") {
    await saveIds([]);
  }

  let split_path = mainPath.split("\\");
  let show_path = `${split_path.at(-2)}\\${split_path.at(-1)}`;

  document.getElementById("show-current-path").value = show_path;
}

const changePath = async () => {
  const pathSelected = await open({
    directory: true,
    multiple: false,
    defaultPath: "$DOCUMENT"
  })

  if (!pathSelected) {
    return false;
  }

  // console.log(`Path selected: ${pathSelected}`);
  
  if (!await exists(`${pathSelected}\\PasswordManager`)) {
    await createDir(`${pathSelected}\\PasswordManager`);
  }

  mainPath = `${pathSelected}\\PasswordManager`;
  jsonAccountsPath = `${mainPath}\\accounts.json`;
  textAccountsPath = `${mainPath}\\accounts.txt`;
  idsPath = `${mainPath}\\ids.json`;

  checkPath();
  savePath();
  updateAccountsList();
}

const savePath = async () => {
  const content = `${mainPath}\n${jsonAccountsPath}\n${textAccountsPath}\n${idsPath}`;
  await writeTextFile("paths.txt", content);
}

const loadPaths = async () => {
  const paths = await readTextFile("paths.txt");
  [mainPath, jsonAccountsPath, textAccountsPath, idsPath] = paths.split("\n");

  // console.log(mainPath);
  // console.log(jsonAccountsPath);
  // console.log(textAccountsPath);
  // console.log(idsPath);

  checkPath();
}

// ## ids related

const readIds = async () => {
  if (!idsPath) return false;
  return JSON.parse(await readTextFile(idsPath));
}

const saveIds = async (ids) => {
  if (!idsPath) return false;
  await writeTextFile(idsPath, JSON.stringify(ids));
}

const addId = async (id) => {

  if (!idsPath) return false;

  const allIds = await readIds();
  allIds.push(id);
  await saveIds(allIds);
}

const removeIds = async (id) => {
  const allIds = await readIds();
  await saveIds(allIds.filter(existingId => existingId !== id));
}

const updateIds = async () => {
  const accounts = await readAccounts();
  let allIds = await readIds();

  for (const accountsList of Object.values(accounts)) {
    for (const [_, account] of accountsList.entries()) {
      if (!allIds.includes(account.id)) {
        allIds.push(account.id);
      }
    }
  }

  await saveIds(allIds);
}

// ## accounts related

const deleteAccount = async () => {
  const del = await window.confirm("Are you sure you want to delete this account?");
  if (!del) return false;

  const id = lastClickedId;
  const accounts = await readAccounts();

  for (const [service, accountList] of Object.entries(accounts)) {
    const index = accountList.findIndex(account => account.id === id);
    if (index !== -1) {
      accountList.splice(index, 1);
      if (accounts[service].length === 0) {
        delete accounts[service];
      }

      break;
    }
  }

  removeIds(id)
  await writeTextFile(jsonAccountsPath, JSON.stringify(accounts));
  updateAccountsList();
  await createTextFile();
  await createBackup();

  const inputSelectors = "#create-account input[type='text'], #account-info input[type='text']"
  document.querySelectorAll(inputSelectors).forEach(input => input.value = "");

  innerHTML("not-safe-password");
  innerHTML("account-already-exists");
  innerHTML("create-account-title", "New Account");
  hideComponent("save", false);
  hideComponent("delete", true);
  hideComponent("edit", true);
  lastClickedId = "";
}

const updateAccount = async (isNewAccount) => {
  const service = document.getElementById("service").value;
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const notes = document.getElementById("notes").value;

  if (!checkInfo(service, username, password)) return false;

  const accounts = await readAccounts();
  let existingAccount;

  if (!accounts[service]) {
    accounts[service] = [];
    existingAccount = false;
  } else {
    existingAccount = accounts[service].find(account => account.username === username);
  }

  if (!existingAccount && !isNewAccount) {
    Object.entries(accounts).forEach(([services, accountsList]) => {
      accountsList.entries().forEach(([index, account]) => {        
        if (account.id === lastClickedId) {
          existingAccount = account;
          accounts[services].splice(index, 1);
          removeIds(account.id);
          return;
        }
      })
    })
  }

  if (existingAccount && isNewAccount) {
    innerHTML("account-already-exists", "The account already exists.");
    return;
  } else if (!existingAccount && !isNewAccount) {
    isNewAccount = true;
  }

  let password_history = [password];
  if (!isNewAccount && !existingAccount["password-history"].includes(password)) {
    password_history = existingAccount["password-history"].push(password);
  }

  const id = isNewAccount ? generatePassword(6) : lastClickedId;
  const edited_account = {
    service,
    username,
    password,
    notes,
    "password-history": password_history,
    favorite: isNewAccount ? false : existingAccount.favorite,
    id
  };

  accounts[service] = accounts[service].filter(acc => acc.id !== id);
  accounts[service].push(edited_account);

  if (isNewAccount) {
    addId(id);
  }

  await writeTextFile(jsonAccountsPath, JSON.stringify(accounts));
  updateAccountsList();

  const inputSelectors = "#create-account input[type='text'], #account-info input[type='text']"
  document.querySelectorAll(inputSelectors).forEach(input => input.value = "");

  innerHTML("not-safe-password");
  innerHTML("account-already-exists");
  innerHTML("create-account-title", "New Account");
  hideComponent("delete", true);
  hideComponent("edit", true);
  hideComponent("save", false);
  lastClickedId = "";

  await createTextFile();
  await createBackup();
}


const editAccount = async () => {
  if (!lastClickedId || lastClickedId === "") return false;

  innerHTML("create-account-title", "Edit Account");

  const edit = await window.confirm("Are you sure you want to edit this account?");
  if (!edit) return false;

  await updateAccount(false);
}


const saveAccount = async () => {
  await updateAccount(true);
}

const readAccounts = async () => {
  // console.log("readAccounts: ", jsonAccountsPath);
  if (!jsonAccountsPath) return false;
  return JSON.parse(await readTextFile(jsonAccountsPath));
}

const saveAccounts = async (accounts) => {
  if (!jsonAccountsPath) return false;
  await writeTextFile(jsonAccountsPath, JSON.stringify(accounts));
}

// # account info related

const checkInfo = (service, username, password) => {
  if (!service || !username || !password) return false;

  if (!isPasswordSafe(password)) {
    innerHTML("not-safe-password", "The password may not be safe enough.");
  }
  return true
}

const findAccountInfo = (accounts, id) => {
  for (const [services, accountsList] of Object.entries(accounts)) {
    for (const [index, accountInfo] of accountsList.entries()) {
      if (accountInfo.id === id) {
        return { serviceName: services, listIndex: index };
      }
    }
  }
  return { serviceName: "", listIndex: 0 }
};

// ## passwords related

const isPasswordSafe = (password) => {
  const hasMinimumLength = password.length >= 8;
  const hasDigit = /\d/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const symbols = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"
  const hasSpecialChar = new RegExp(`[${symbols}]`).test(password);

  // console.log("hasMinimumLength ", hasMinimumLength)
  // console.log("hasDigit ", hasDigit)
  // console.log("hasLowercase ", hasLowercase)
  // console.log("hasUppercase ", hasUppercase)
  // console.log("hasSpecialChar ", hasSpecialChar)

  return hasMinimumLength && hasDigit && (hasLowercase || hasUppercase) && hasSpecialChar;
};


const getPassword = () => {
  const newPassword = generatePassword();
  document.getElementById("password").value = newPassword;
  innerHTML("not-safe-password");
};

const generatePassword = (length=0) => {
  const chars = "abcdefghijklmnopqrstuvwxyz" +
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
    "0123456789" +
    "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"

  if (length == 0) {
    length = document.getElementById("password-length").value;
  }

  let password = "";
  for (let i = 0; i <= length - 1; i++) {
    const index = Math.floor(Math.random() * chars.length);
    password += chars[index];
  }

  let symbols = "!\"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~" /* !"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~ */

  let lower = /[a-z]/g.test(password);
  let upper = /[A-Z]/g.test(password);
  let number = /[0-9]/g.test(password);
  let symbol = new RegExp(`[${symbols}]`).test(password);

  if (lower && upper && number && symbol) {
    return password;
  }
  
  return generatePassword(length);
}

// # utilities

const hideComponent = (id, hide = true) => {
  const component = document.getElementById(id);
  component.hidden = hide;
};


const innerHTML = (id, text = "") => {
  document.getElementById(id).innerHTML = text;
};

// itemOnClick
const setValue = (id, value) => {
  document.getElementById(id).value = value;
  document.getElementById(id+"-info").value = value;
}

// # html related

const updateRange = () => {
  let length = document.getElementById("password-length").value;
  document.getElementById("show-length").textContent = `Length ${length}`;
}

const updateSafePassErr = () => {
  const password = document.getElementById("password").value;
  const isSafe = isPasswordSafe(password);
  document.getElementById("not-safe-password").textContent = isSafe ? "" : 
    "The password may not be safe enough.";
}

const createItem = (accountInfo) => {
  let list = document.getElementById("list");

  let div_accounts_list_item = document.createElement("div");
  div_accounts_list_item.setAttribute("class", "accounts-list-item");
  
  let div_account_info = document.createElement("div");
  div_account_info.setAttribute("class", "account-info");
  div_account_info.addEventListener("click", () => itemOnClick(accountInfo["id"]));

  let p_service = document.createElement("p");
  p_service.setAttribute("class", "service");
  p_service.innerHTML = accountInfo["service"]

  let p_username = document.createElement("p");
  p_username.setAttribute("class", "username");
  p_username.innerHTML = accountInfo["username"]

  let p_notes = document.createElement("p");
  p_notes.setAttribute("class", "notes");
  p_notes.innerHTML = accountInfo["notes"];

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
  
  svg_fav_icon.append(g_SVGRepo_bgCarrier, g_SVGRepo_tracerCarrier);
  SVGRepo_iconCarrier.appendChild(favPath);
  svg_fav_icon.appendChild(SVGRepo_iconCarrier);
  div_icon_button.appendChild(svg_fav_icon);
  div_icon_container.appendChild(div_icon_button);
  div_account_info.append(p_service, p_username, p_notes);
  div_accounts_list_item.append(div_account_info, div_icon_container);
  list.appendChild(div_accounts_list_item);
}


const getFilter = async () => {
  const filter = document.getElementById("filter").value || null;
  await updateAccountsList(filter);
}

const updateAccountsList = async (filter=null) => {
  const accounts = await readAccounts();

  // console.log("updateAccountsList: ", accounts);

  if (!accounts && accounts != {}) return false;

  const list = document.getElementById("list");
  list.innerHTML = "";

  const accountsListed = new Set();
  const accountsToList = [];
  let favorites = 0;

  Object.entries(accounts).forEach(([service, accountsList]) => {
    accountsList.forEach((account) => {
      if (!filter || service.toLowerCase().includes(filter.toLowerCase())) {
        if (!accountsListed.has(account.id)) {
          if (account.favorite) {
            accountsToList.unshift(account);
            favorites += 1;
          } else {
            accountsToList.push(account);
          }
          accountsListed.add(account.id);
        }
      }
    });
  });

  accountsToList.forEach((account) => {
    createItem(account);
    if (favorites > 0) {
      setFavorite(account.id);
      favorites -= 1;
    }
  });
}

const setFavorite = async (id) => {
  document.getElementById(id+"_svg").setAttribute("class", "favorite");
  document.getElementById(id+"_path").setAttribute("fill", "#ffff00");
}

// ## events

const clear = () => {
  const length = document.getElementById("password-length").value;
  const inputSelectors = "#create-account input[type='text'], #account-info input[type='text']";
  document.querySelectorAll(inputSelectors).forEach(input => input.value = "");
  
  document.getElementById("password-length").value = length;
  innerHTML("create-account-title", "New Account");
  innerHTML("not-safe-password");
  innerHTML("account-already-exists");
  hideComponent("edit", true);
  hideComponent("delete", true)
  hideComponent("save", false);
  lastClickedId = "";
}

// list item functions

const copyOnMouseOver = (id) => {
  document.getElementById(id).setAttribute("fill", "#396cd8");
}

const copyOnMouseOut = (id) => {
  document.getElementById(id).setAttribute("fill", "#000000");
}

const favOnMouseOver = (id) => {
  document.getElementById(id).setAttribute("fill", "#ffff00");
}


const favOnMouseOut = (id) => {
  let fav_icon = document.getElementById(id+"_svg");
  if (fav_icon.classList.contains("favorite")) return;
  document.getElementById(id+"_path").setAttribute("fill", "#000000");
}


const favOnClick = async (id) => {
  const fav_icon = document.getElementById(id+"_svg")
  const fav_path = document.getElementById(id+"_path")

  const accounts = await readAccounts();
  const { serviceName, listIndex } = findAccountInfo(accounts, id);

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
  await writeTextFile(jsonAccountsPath, json_string);

  updateAccountsList();
}

const itemOnClick = async (itemId) => {
  innerHTML("create-account-title", "Edit Account");
  hideComponent("save", true);
  lastClickedId = itemId;

  const accounts = await readAccounts();
  const { serviceName, listIndex } = findAccountInfo(accounts, itemId);

  if (!serviceName) {
    return false
  }

  setValue("service", accounts[serviceName][listIndex]["service"]);
  setValue("username", accounts[serviceName][listIndex]["username"]);
  setValue("password", accounts[serviceName][listIndex]["password"]);
  setValue("notes", accounts[serviceName][listIndex]["notes"]);

  hideComponent("edit", false);
  hideComponent("delete", false);
}

const copy = async (info) => {
  if (!lastClickedId) return false;

  let currentAccount = null;
  const accounts = await readAccounts();
  for (const [_, accountsList] of Object.entries(accounts)) {
    for (const [_, account] of accountsList.entries()) {
      if (account.id === lastClickedId) {
        currentAccount = account;
      }
    }
  }

  // console.log(currentAccount[info])

  if (!currentAccount) return false;
  navigator.clipboard.writeText(currentAccount[info]);
}

window.addEventListener("load", async () => {
  await loadPaths();
  await updateIds();
  updateAccountsList();
  console.log(window.innerWidth, window.innerHeight);
  document.addEventListener('contextmenu', event => event.preventDefault());
})

function App() {
  return (
    <div className="container">

      <div id="nav">
        <div id="search">
          <input type="text" placeholder="Search any service to filter" id="filter" onChange={getFilter} />
          <button id="filter-button" onClick={getFilter}></button>
        </div>

        <div id="util">
          <button id="notifications"></button>
          <button id="settings"></button>
        </div>
      </div>

      <div id="accounts-list">
        <button id="new-account">New Item</button>
      </div>

      <div id="account-info">

      </div>

    </div>
  );
}

export default App;

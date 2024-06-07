import React from "react";
import { writeTextFile, readTextFile, exists, createDir, copyFile } from "@tauri-apps/api/fs";
import { open } from "@tauri-apps/api/dialog";

let lastClickedId;
let monthsToUpdate = 3;
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
  innerHTML("file-generated", `File created in ${mainPath}\\accounts.txt`);
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
  // await copyFile(textAccountsPath, `${backupPath}\\accounts.txt`);
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

  const display = document.getElementById("directory-display");
  display.value = show_path;
  display.className = "directory-found";
}

const changePath = async (action=null) => {
  if (action === "clear") {
    mainPath = "";
    jsonAccountsPath = "";
    textAccountsPath = "";
    idsPath = "";

    saveConfig();
    updateAccountsList();

    const display = document.getElementById("directory-display");
    display.value = "";
    display.className = "directory-not-found";
    return;
  }

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
  saveConfig();
  updateAccountsList();
}

const saveConfig = async () => {
  const config = {
    "accounts-directory": mainPath,
    "months-to-update": monthsToUpdate
  }

  await writeTextFile("passmanager.config.json", JSON.stringify(config));
}

const loadPaths = async (config) => {
  mainPath = config["accounts-directory"];

  if (!mainPath) return false;

  jsonAccountsPath = `${mainPath}\\accounts.json`;
  textAccountsPath = `${mainPath}\\accounts.txt`;
  idsPath = `${mainPath}\\ids.json`;

  checkPath();
}

const loadConfig = async () => {
  const config = JSON.parse(await readTextFile("passmanager.config.json"));

  if (!config) {
    await saveConfig();
    return loadConfig();
  }

  await loadPaths(config);

  monthsToUpdate = config["months-to-update"];
  document.getElementById("months-to-update").value = monthsToUpdate;
}

const monthsUpdate = async (amount) => {
  document.getElementById("months-to-update").value = monthsToUpdate = amount;
  await saveConfig();
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
  await createBackup();

  const inputSelectors = "#create-account input[type='text'], #account-info input[type='text']"
  document.querySelectorAll(inputSelectors).forEach(input => input.value = "");

  innerHTML("not-safe-password");
  innerHTML("account-already-exists");
  innerHTML("create-account-title", "New Account");
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
  lastClickedId = "";

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

const innerHTML = (id, text = "") => {
  document.getElementById(id).innerHTML = text;
};

// itemOnClick
const setValue = (id, value) => {
  document.getElementById(id).value = value;
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

  const list = document.getElementById("list");
  list.innerHTML = "";

  if (!accounts && accounts != {}) return false;

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
      favorites -= 1;
    }
  });
}

const setFavorite = async () => {
  const favoriteButton = document.getElementById("favorite-button");

  if (favoriteButton.className === "not-favorite") favoriteButton.className = "favorite";
  else favoriteButton.className = "not-favorite";
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
  lastClickedId = "";
}

const monthsDropdown = () => {
  const dropdown = document.getElementById("months-dropdown");
  const dropdownInput = document.getElementById("months-to-update");

  if (dropdown.style.display === "flex") {
    dropdown.style.display = "none";

    dropdownInput.classList.remove("drop-up");
    dropdownInput.classList.add("drop-down");
  } else {
    dropdown.style.display = "flex";

    dropdownInput.classList.remove("drop-down");
    dropdownInput.classList.add("drop-up");
  }
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
  turnVisibility("off");

  const accountInfo = document.getElementById("account-info");
  accountInfo.style = "display: block;";
  accountInfo.className = "slide-in";

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
}

const closeInfo = async () => {
  const accountInfo = document.getElementById("account-info");
  accountInfo.classList.remove("slide-in");
  accountInfo.className = "slide-out";

  setValue("service", "");
  setValue("username", "");
  setValue("password", "");
  setValue("notes", "");
}

const copy = async (info) => {
  // if (!lastClickedId) return false;

  // let currentAccount = null;
  // const accounts = await readAccounts();
  // for (const [_, accountsList] of Object.entries(accounts)) {
  //   for (const [_, account] of accountsList.entries()) {
  //     if (account.id === lastClickedId) {
  //       currentAccount = account;
  //     }
  //   }
  // }

  // if (!currentAccount) return false;

  const password = document.getElementById("password");
  if (!password.value) return false;

  navigator.clipboard.writeText(password.value);
}

const closePopup = () => {
  const blur = document.getElementById("blur");
  blur.style = "";

  const popup = document.querySelector(".popup");
  popup.classList.remove("zoom-in");
  popup.classList.add("zoom-out");

  innerHTML("file-generated", "");
}

const openPopup = (id) => {
  const popup = document.getElementById(id);
  popup.style = "display: block;";
  popup.classList.remove("zoom-out");
  popup.classList.add("zoom-in");

  const blur = document.getElementById("blur");
  blur.style = "display: block; backdrop-filter: blur(3px);";
}

const turnVisibility = (turn) => {
  const visibility = document.getElementById("visibility");
  const password = document.getElementById("password");
  let isVisible = password.getAttribute("type");

  if (turn === "off") {
    isVisible = "text";
  } else if (turn === "on") {
    isVisible = "password";
  }

  if (isVisible === "text") {
    password.setAttribute("type", "password");
    visibility.className = "invisible";
  } else if (isVisible === "password") {
    password.setAttribute("type", "text")
    visibility.className = "visible";
  }
}

window.addEventListener("load", async () => {
  await loadConfig();
  await updateIds();
  updateAccountsList();
  console.log(window.innerWidth, window.innerHeight);
  // document.addEventListener('contextmenu', event => event.preventDefault());
})

function App() {
  return (
    <div className="container">

      <div id="main">
        
        <div id="nav">
          <div id="search">
            <input type="text" placeholder="Search any service to filter" id="filter" onChange={getFilter} />
            <button id="filter-button" onClick={getFilter}></button>
          </div>

          <div id="util">
            <div className="dropdown">
              <button id="notifications"></button>
              <div id="notifications-dropdown" className="dropdown-content">

              </div>
            </div>

            <button id="settings" onClick={() => { openPopup("settings-popup") }}></button>
          </div>
        </div>

        <div id="accounts-list">
          <ul id="list"></ul>
          <button id="new-account"></button>
        </div>

        <div id="account-info">
          <div id="info-nav">
            <div id="close-decoration">
              <button id="close-info" onClick={closeInfo}></button>
            </div>

            <div id="decorations">
              <button id="favorite-button" className="not-favorite" onClick={setFavorite}></button>
              <button id="edit"></button>
              <button id="more"></button>
            </div>
          </div>

          <div id="warning-notification">
            <p id="warning">Your account is safe.</p>
          </div>

          <div id="info-display">

            <div id="service-info" className="info">
              <p className="info-title" id="service-title">Service</p>
              <input type="text" readOnly className="read-only" id="service" placeholder="Service" />
            </div>

            <div id="username-info" className="info">
              <p className="info-title" id="username-title">Username</p>
              <input type="text" readOnly className="read-only" id="username" placeholder="example@abc.com" />
            </div>

            <div id="password-info" className="info">
              <div id="password-info-display">
                <p className="info-title" id="password-title">Password</p>
                <input type="password" readOnly className="read-only" id="password" placeholder="Password" />
              </div>

              <div id="password-info-decorations">
                <button id="copy-password" onClick={copy}></button>
                <button id="visibility" className="invisible" onClick={turnVisibility}></button>
              </div>
            </div>

            <div id="notes-info" className="info">
              <p className="info-title" id="notes-title">Notes</p>
              <input type="text" readOnly className="read-only" id="notes" placeholder="Notes/Observations" />
            </div>

          </div>
        </div>
      </div>

      <div id="blur" onClick={closePopup}></div>

      <div id="settings-popup" className="popup zoom-out">
        <div id="settings-nav">
          <h1 id="settings-title">Settings</h1>
        </div>

        <div id="settings-options">
          <div id="directory-option" className="settings-option">
            <p id="change-directory-title">Change Directory</p>
            <input type="text" className="directory-not-found read-only" placeholder="Click here to select/change the path"
              id="directory-display" readOnly onClick={changePath} />
            <button id="clear-directory" onClick={() => changePath("clear")}>Clear</button>
          </div>

          <div id="months-option" className="settings-option">
            <p id="months-to-update-title">Amount of months to update passwords</p>

            <div className="dropdown">
              <p className="notify-in">Notify in</p>
              <input onClick={monthsDropdown} type="text" readOnly className="read-only drop-down" id="months-to-update" value={"1"} />
              <p className="notify-in">months</p>

              <div id="months-dropdown" className="dropdown-content">
                <a href="#" onClick={ () => { monthsUpdate(1) } }>1</a>
                <a href="#" onClick={ () => { monthsUpdate(2) } }>2</a>
                <a href="#" onClick={ () => { monthsUpdate(3) } }>3</a>
                <a href="#" onClick={ () => { monthsUpdate(4) } }>4</a>
                <a href="#" onClick={ () => { monthsUpdate(5) } }>5</a>
                <a href="#" onClick={ () => { monthsUpdate(6) } }>6</a>
              </div>
            </div>
          </div>

          <div className="settings-option" id="create-txt-file">
            <p id="create-txt-file-title">Generate an easy to read text file with all your accounts</p>
            <button className="inline-block" id="create-txt" onClick={createTextFile}>Generate File</button>
            <p className="inline-block" id="file-generated"></p>
          </div>

        </div>
      </div>

      <div id="create-account-popup">

      </div>

      <div id="edit-account-popup">

      </div>

    </div>
  );
}

export default App;

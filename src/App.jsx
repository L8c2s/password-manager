import React from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { writeTextFile, readTextFile } from "@tauri-apps/api/fs";
import "./App.css";


// check account info

const isPasswordSafe = (password) => {
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

const checkInfo = (service, username, password) => {
  if (service.length == 0) return false
  if (username.length == 0) return false
  if (password.length == 0) return false

  if (!isPasswordSafe(password)) {
    document.getElementById("not-safe-password").innerHTML = "The password may not be safe enough."
  }
  return true
}

const checkUsername = (service, username, accounts) => {
  for (let [svc, accountList] of Object.entries(accounts)) {
    for (let [_, account] of accountList.entries()) {
      if (svc == service && account["username"] == username) {
        return true;
      }
    }
  }
}

const accountAlreadyExists = () => {
  document.getElementById("account-already-exists").innerHTML = "The account already exists.";
}

// file functions

const enableEditAccount = () => {
  document.getElementById("create-account-title").innerHTML = "New Account";
  document.getElementById("save").removeAttribute("hidden");
}

const deleteAccount = () => {
  document.getElementById("create-account-title").innerHTML = "New Account";
}

const saveAccount = async () => {
  const service = document.getElementById("service").value;
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const notes = document.getElementById("notes").value;

  if (!checkInfo(service, username, password)) return false;

  let accounts = await readAccounts();
  if (!accounts.hasOwnProperty(service)) {
    accounts[service] = []
  } else {
    if (checkUsername(service, username, accounts)) {
      return accountAlreadyExists();
    }
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
  // json_string = await invoke("serialize", { accounts: json_string })
  await writeTextFile("C:/Users/luhlu/Documents/passwords/tests/accounts.json", json_string);
  createItem(new_account);
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

const usedIds = async (id) => {
  let allIds = await readTextFile("C:/Users/luhlu/Documents/passwords/ids.json");
  allIds = JSON.parse(allIds);
  allIds.push(id);
  
  allIds = JSON.stringify(allIds);
  await writeTextFile("C:/Users/luhlu/Documents/passwords/ids.json", allIds);
}

const readAccounts = async () => {
  let accounts = await readTextFile("C:/Users/luhlu/Documents/passwords/tests/accounts.json")
  let allaccounts = JSON.parse(accounts);
  return allaccounts
}

// input functions

const getPassword = () => {
  let password = generatePassword();
  document.getElementById("password").value = password;
  document.getElementById("not-safe-password").innerHTML = "";
}

const generatePassword = (length=0) => {
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
  if (length == 0) {
    length = document.getElementById("password-length").value;
  }

  let password = [];
  for (let i = 0; i <= length - 1; i++) {
    password.push(chars.charAt(Math.floor(Math.random() * chars.length)));
  }

  password = password.join("");

  let lower = false;
  let upper = false;
  let number = false;
  let symbol = false;

  for (let i = 0; i < password.length; i++) {
    const char = password[i];
    if (lowercase.includes(char)) {
      lower = true;
    } else if (uppercase.includes(char)) {
      upper = true;
    } else if (digits.includes(char)) {
      number = true;
    } else if (symbols.includes(char)) {
      symbol = true;
    }
  }

  console.log(password);
  console.log(lower, upper, number, symbol)

  if (lower && upper && number && symbol) {
    return password;
  }
  
  return generatePassword(length);
}

const updateRange = () => {
  let length = document.getElementById("password-length").value;
  document.getElementById("show-length").innerHTML = "Length: " + length;
}

const updateSafePassErr = () => {
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

  document.getElementById("create-account-title").innerHTML = "New Account";
  document.getElementById("password-length").value = length;
  document.getElementById("not-safe-password").innerHTML = "";
  document.getElementById("edit").setAttribute("hidden", "true")
  document.getElementById("delete").setAttribute("hidden", "true")
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

  // <div className="accounts-list-item" onClick={() => itemOnClick("0")}>
  //   <div className="account-info">
  //     <p className="service">Google</p>
  //     <p className="username">luhluizferreira@gmail.com</p>
  //   </div>

  //   <div className="icon-container" id="0">  
  //     <div className="icon-button" id="favorite-icon">
  //       <svg onClick={favOnClick} onMouseOver={favOnMouseOver} onMouseOut={favOnMouseOut} id="fav-icon" 
  //         className="not-favorite" width="23px" height="23px" viewBox="0 -1 1024 1024" fill="" version="1.1" xmlns="http://www.w3.org/2000/svg">
  //           <g id="SVGRepo_bgCarrier" strokeWidth="0"/>
  //           <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"/>
  //           <g id="SVGRepo_iconCarrier">
  //             <path id="favPath" d="M802.4 967.2c-7.2 0-15.2-1.6-21.6-4.8l-258.4-128.8-252.8 140c-18.4 10.4-41.6 
  //               5.6-56-9.6-8.8-9.6-12.8-23.2-11.2-36.8l43.2-285.6L33.6 444C20.8 432 16 414.4 21.6 397.6c4.8-16.8 
  //                 18.4-28.8 36-31.2l285.6-48L464.8 56c7.2-15.2 22.4-25.6 39.2-26.4 17.6-0.8 33.6 8.8 41.6 24l133.6 
  //                   256.8 287.2 35.2c17.6 2.4 31.2 13.6 36.8 30.4 5.6 16 1.6 34.4-10.4 46.4L790.4 629.6l55.2 284c2.4 
  //                     12.8-0.8 26.4-8.8 36.8-8.8 10.4-21.6 16.8-34.4 16.8zM520.8 784.8c7.2 0 15.2 1.6 21.6 4.8l255.2 
  //                       127.2-54.4-280c-3.2-14.4 1.6-29.6 12-40l200-203.2L672 358.4c-14.4-1.6-28-11.2-34.4-24L506.4 
  //                         81.6 385.6 340c-6.4 13.6-19.2 23.2-33.6 25.6L70.4 412l208 194.4c11.2 10.4 16 24.8 13.6 
  //                           40L249.6 928l249.6-137.6c7.2-3.2 14.4-4.8 21.6-5.6z" fill=""/>
  //           </g>
  //       </svg>
  //     </div>
  //   </div>
  // </div>
}

// list item functions

const copyOnMouseOver = () => {
  let copy_icon = document.getElementById("cpy-icon")
  copy_icon.setAttribute("fill", "#396cd8")
}

const copyOnMouseOut = () => {
  let copy_icon = document.getElementById("cpy-icon")
  copy_icon.setAttribute("fill", "#000000")
}

const favOnMouseOver = (id) => {
  let fav_path = document.getElementById(id)
  fav_path.setAttribute("fill", "#ffff00")
}

const favOnMouseOut = (id) => {
  let fav_path = document.getElementById(id+"_path")
  let fav_icon = document.getElementById(id+"_svg")

  if (fav_icon.getAttribute("class") == "not-favorite") {
    fav_path.setAttribute("fill", "#000000")
  }
}

const favOnClick = (id) => {
  let fav_icon = document.getElementById(id+"_svg")
  let fav_path = document.getElementById(id+"_path")

  let saved = fav_icon.getAttribute("class")
  if (saved == "favorite") {
    fav_path.setAttribute("fill", "#000000")
    fav_icon.setAttribute("class", "not-favorite")
  } else if (saved == "not-favorite") {
    fav_path.setAttribute("fill", "#ffff00")
    fav_icon.setAttribute("class", "favorite")
  }
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
      }
    }
  }

  if (currentService == 0) {
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

  for (let [service, accountList] of Object.entries(accounts)) {
    for (let [index, account] of accountList.entries()) {
      if (account["id"] == itemId) {
        currentAccount = account;
      }
    }
  }

  let password = currentAccount["password"];
  navigator.clipboard.writeText(password);
}

function App() {
  return (
    <div className="container">
      <div className="display" id="account-info">
        <h3 className="title" id="account-info-title">Account Info</h3>
        <button id="get-info" onClick={readAccounts}>Read</button>

        <div onClick={() => copy("0")} className="icon-button" id="copy-icon">
          <svg width="35px" onMouseOver={copyOnMouseOver} onMouseOut={copyOnMouseOut} id="cpy-icon" height="35px" viewBox="0 3 25 25" fill="#000000" xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_bgCarrier" strokeWidth="0"/>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"/>
            <g id="SVGRepo_iconCarrier">
              <path d="M8.25005 8.5C8.25005 8.91421 8.58584 9.25 9.00005 9.25C9.41426 9.25 9.75005 8.91421 9.75005 8.5H8.25005ZM9.00005 8.267H9.75006L9.75004 8.26283L9.00005 8.267ZM9.93892 5.96432L10.4722 6.49171L9.93892 5.96432ZM12.2311 5V4.24999L12.2269 4.25001L12.2311 5ZM16.269 5L16.2732 4.25H16.269V5ZM18.5612 5.96432L18.0279 6.49171V6.49171L18.5612 5.96432ZM19.5 8.267L18.75 8.26283V8.267H19.5ZM19.5 12.233H18.75L18.7501 12.2372L19.5 12.233ZM18.5612 14.5357L18.0279 14.0083L18.5612 14.5357ZM16.269 15.5V16.25L16.2732 16.25L16.269 15.5ZM16 14.75C15.5858 14.75 15.25 15.0858 15.25 15.5C15.25 15.9142 15.5858 16.25 16 16.25V14.75ZM9.00005 9.25C9.41426 9.25 9.75005 8.91421 9.75005 8.5C9.75005 8.08579 9.41426 7.75 9.00005 7.75V9.25ZM8.73105 8.5V7.74999L8.72691 7.75001L8.73105 8.5ZM6.43892 9.46432L6.97218 9.99171L6.43892 9.46432ZM5.50005 11.767H6.25006L6.25004 11.7628L5.50005 11.767ZM5.50005 15.734L6.25005 15.7379V15.734H5.50005ZM8.73105 19L8.72691 19.75H8.73105V19ZM12.769 19V19.75L12.7732 19.75L12.769 19ZM15.0612 18.0357L14.5279 17.5083L15.0612 18.0357ZM16 15.733H15.25L15.2501 15.7372L16 15.733ZM16.75 15.5C16.75 15.0858 16.4143 14.75 16 14.75C15.5858 14.75 15.25 15.0858 15.25 15.5H16.75ZM9.00005 7.75C8.58584 7.75 8.25005 8.08579 8.25005 8.5C8.25005 8.91421 8.58584 9.25 9.00005 9.25V7.75ZM12.7691 8.5L12.7732 7.75H12.7691V8.5ZM15.0612 9.46432L15.5944 8.93694V8.93694L15.0612 9.46432ZM16.0001 11.767L15.2501 11.7628V11.767H16.0001ZM15.2501 15.5C15.2501 15.9142 15.5858 16.25 16.0001 16.25C16.4143 16.25 16.7501 15.9142 16.7501 15.5H15.2501ZM9.75005 8.5V8.267H8.25005V8.5H9.75005ZM9.75004 8.26283C9.74636 7.60005 10.0061 6.96296 10.4722 6.49171L9.40566 5.43694C8.65985 6.19106 8.24417 7.21056 8.25006 8.27117L9.75004 8.26283ZM10.4722 6.49171C10.9382 6.02046 11.5724 5.75365 12.2352 5.74999L12.2269 4.25001C11.1663 4.25587 10.1515 4.68282 9.40566 5.43694L10.4722 6.49171ZM12.2311 5.75H16.269V4.25H12.2311V5.75ZM16.2649 5.74999C16.9277 5.75365 17.5619 6.02046 18.0279 6.49171L19.0944 5.43694C18.3486 4.68282 17.3338 4.25587 16.2732 4.25001L16.2649 5.74999ZM18.0279 6.49171C18.494 6.96296 18.7537 7.60005 18.7501 8.26283L20.25 8.27117C20.2559 7.21056 19.8402 6.19106 19.0944 5.43694L18.0279 6.49171ZM18.75 8.267V12.233H20.25V8.267H18.75ZM18.7501 12.2372C18.7537 12.8999 18.494 13.537 18.0279 14.0083L19.0944 15.0631C19.8402 14.3089 20.2559 13.2894 20.25 12.2288L18.7501 12.2372ZM18.0279 14.0083C17.5619 14.4795 16.9277 14.7463 16.2649 14.75L16.2732 16.25C17.3338 16.2441 18.3486 15.8172 19.0944 15.0631L18.0279 14.0083ZM16.269 14.75H16V16.25H16.269V14.75ZM9.00005 7.75H8.73105V9.25H9.00005V7.75ZM8.72691 7.75001C7.6663 7.75587 6.65146 8.18282 5.90566 8.93694L6.97218 9.99171C7.43824 9.52046 8.07241 9.25365 8.73519 9.24999L8.72691 7.75001ZM5.90566 8.93694C5.15985 9.69106 4.74417 10.7106 4.75006 11.7712L6.25004 11.7628C6.24636 11.1001 6.50612 10.463 6.97218 9.99171L5.90566 8.93694ZM4.75005 11.767V15.734H6.25005V11.767H4.75005ZM4.75006 15.7301C4.73847 17.9382 6.51879 19.7378 8.72691 19.75L8.7352 18.25C7.35533 18.2424 6.2428 17.1178 6.25004 15.7379L4.75006 15.7301ZM8.73105 19.75H12.769V18.25H8.73105V19.75ZM12.7732 19.75C13.8338 19.7441 14.8486 19.3172 15.5944 18.5631L14.5279 17.5083C14.0619 17.9795 13.4277 18.2463 12.7649 18.25L12.7732 19.75ZM15.5944 18.5631C16.3402 17.8089 16.7559 16.7894 16.75 15.7288L15.2501 15.7372C15.2537 16.3999 14.994 17.037 14.5279 17.5083L15.5944 18.5631ZM16.75 15.733V15.5H15.25V15.733H16.75ZM9.00005 9.25H12.7691V7.75H9.00005V9.25ZM12.7649 9.24999C13.4277 9.25365 14.0619 9.52046 14.5279 9.99171L15.5944 8.93694C14.8486 8.18282 13.8338 7.75587 12.7732 7.75001L12.7649 9.24999ZM14.5279 9.99171C14.994 10.463 15.2537 11.1001 15.2501 11.7628L16.75 11.7712C16.7559 10.7106 16.3402 9.69106 15.5944 8.93694L14.5279 9.99171ZM15.2501 11.767V15.5H16.7501V11.767H15.2501Z" fill=""/>
            </g>
          </svg>
        </div>
      </div>

      <div className="display" id="accounts-list">
        <h3 className="title" id="accounts-list-title">Accounts List</h3>
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
          <button id="cancel" onClick={clear}>Cancel</button>
          <button id="edit" onClick={enableEditAccount} hidden>Edit</button>
          <button id="delete" onClick={deleteAccount} hidden>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default App;

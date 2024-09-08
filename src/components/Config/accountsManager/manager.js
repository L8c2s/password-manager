import { React, useEffect, useState } from "react";
import { readTextFile, writeTextFile } from "@tauri-apps/api/fs";

import { getConfigValue } from "../config";


export async function getAccounts() {
    let accounts;
    try {
        accounts = await readTextFile(`${await getConfigValue("accounts_dir")}/accounts.json`);
    } catch { 
        accounts = "{}";
    }

    if (!accounts) {
        accounts = "{}";
    }

    return JSON.parse(accounts);
}

export async function saveAccounts(accounts) {
    if (!accounts) return;
    await writeTextFile(`${await getConfigValue("accounts_dir")}/accounts.json`, JSON.stringify(accounts));
}

export function getAccount(accounts, accountId) {
    for (const service in accounts) {
        for (let i = 0; i < accounts[service].length; i++) {

            if (accounts[service][i].id === accountId) {
                return accounts[service][i];
            }
        }
    }
}

export async function getKey(accounts, accountId, key) {
    let account = getAccount(accounts, accountId);
    return account[key] ? account[key] : null;
}

export async function editAccount(accounts, accountId, newAccount) {
    for (const service in accounts) {
        for (let i = 0; i < accounts[service].length; i++) {
            let account = accounts[service][i]
            if (account.id === accountId) {
                accounts[service][i] = newAccount;
                await saveAccounts(accounts);
                break;
            }
        }
    }

    return accounts;
}

export async function editAccountKey(accounts, accountId, key, newValue) {
    console.log(accounts, accountId, key, newValue);
    let account = getAccount(accounts, accountId);
    account[key] = newValue;
    return await editAccount(accounts, accountId, account);
}

export async function deleteAccount(accounts, accountId) {
    for (const service in accounts) {
        for (let i = 0; i < accounts[service].length; i++) {
            console.log(accounts[service][i])
            console.log(accountId);
            if (accounts[service][i].id === accountId) {
                accounts[service].splice(i, 1);
            }
        }
    }

    await saveAccounts(accounts);
    return accounts;
}

export async function setAccountFavorite(accounts, accountId, newFavorite) {
    let account = getAccount(accounts, accountId);
    account.favorite = newFavorite;
    await editAccount(accounts, accountId, account);
}

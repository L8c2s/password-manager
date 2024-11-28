import { exists, mkdir, readTextFile, writeTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { appDataDir } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/core";


const MAINPATH = await appDataDir();
const ACCOUNTSPATH = "accounts";


export async function getDateTime() {
    const datetime = await invoke("get_date_time");
    const [date, time] = datetime.split(" ");

    let [year, month, day] = date.split("-");
    let [hour, minute, second] = time.split(":");

    return `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
}

export function generatePassword(length=8) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-={}[]\:;'<>,.?/~`";
    let password = "";

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        password += chars.charAt(randomIndex);
    }

    const lower = /[a-z]/.test(password);
    const upper = /[A-Z]/.test(password);
    const number = /[0-9]/.test(password);
    const symbol = /[^a-zA-Z0-9]/.test(password);

    if (!lower && !upper) return generatePassword(length);
    if (!number) return generatePassword(length);
    if (!symbol) return generatePassword(length);

    return password;
}

export async function getAccounts() {
    let accounts;
    try {
        accounts = await readTextFile(ACCOUNTSPATH, { baseDir: BaseDirectory.AppConfig });
    } catch (error) {
        console.log("Could not load accounts: ", error);
        accounts = false;
    }
    accounts = await invoke("decrypt_password", { encryptedPassword: accounts });

    if (!accounts) {
        accounts = "{}";
    }

    accounts = JSON.parse(accounts);
    return accounts;
}

export async function saveAccounts(accounts) {
    if (!accounts) return;

    if (!await exists(MAINPATH)) {
        await mkdir(MAINPATH);
    }

    accounts = await invoke("encrypt_password", { password: JSON.stringify(accounts) });
    await writeTextFile(ACCOUNTSPATH, accounts, { baseDir: BaseDirectory.AppData });
    await createBackup(accounts);
}

async function getBackupFileName() {
    const currentTime = await getDateTime();
    return `${currentTime.split(".")[0].replace(/:/g, "-")}`;
}

async function createBackup(accounts) {
    const backupPath = "backup";
    const filePath = `${backupPath}/${await getBackupFileName()}`;

    if (!await exists(backupPath, { baseDir: BaseDirectory.AppData })) {
        await mkdir(backupPath, { baseDir: BaseDirectory.AppData });
    }

    await writeTextFile(filePath, accounts, { baseDir: BaseDirectory.AppData });
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
    let account = getAccount(accounts, accountId);
    account[key] = newValue;
    return await editAccount(accounts, accountId, account);
}

export async function deleteAccount(accounts, accountId) {
    for (const service in accounts) {
        for (let i = 0; i < accounts[service].length; i++) {
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

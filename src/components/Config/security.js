import { invoke } from "@tauri-apps/api/core";

export function checkPasswordSecurity(password) {
    if (!password) return false;
    // check if the password has at least 8 in length
    if (password.length < 8) return false;
    // check if the password has letters, numbers and symbols
    // letters can be either uppercase or lowercase
    if (!/[A-Z]/.test(password))
        if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[^A-Za-z0-9]/.test(password)) return false;

    return true;
}

export async function checkPasswordUnique(accounts, accountId, accountPassword) {
    let occurrences = 0;

    for (const service in accounts) {
        for (const acc of accounts[service]) {
            let decryptedPassword = await invoke("decrypt_password", { encryptedPassword: acc.password });

            if (decryptedPassword === accountPassword && accountId !== acc.id) {
                occurrences++;
            }
        }
    }

    return occurrences;
}
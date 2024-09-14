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

export function checkPasswordUnique(accounts, account) {
    let occurrences = 0;

    for (const service in accounts) {
        accounts[service].forEach((acc) => {
            if (acc.password === account.password && acc.id !== account.id) {
                occurrences++;
            }
        })
    }

    return occurrences;
}
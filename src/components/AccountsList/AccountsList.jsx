import { readTextFile } from "@tauri-apps/api/fs";
import React, { useState, useEffect } from "react";
import "./AccountsList.css";

import { getConfigValue } from "../Config/config";


export function UpdateList({ searchTerm }) {
    const [accountsDir, setAccountsDir] = useState("");
    const [accounts, setAccounts] = useState({});
    const [filteredAccounts, setFilteredAccounts] = useState([]);

    useEffect(() => {
        const loadDir = async () => {
            let dirSet = await getConfigValue("accounts_dir");
            setAccountsDir(`${dirSet}/accounts.json`);
        };
        loadDir();
    }, [])

    useEffect(() => {
        const loadAccounts = async () => {
            let accountsFile;
            try {
                accountsFile = await readTextFile(accountsDir);
            } catch {
                accountsFile = "";
            }

            if (!accountsFile) {
                accountsFile = "{}";
            }

            setAccounts(await JSON.parse(accountsFile));
        }
        loadAccounts();
    }, [accountsDir])

    useEffect(() => {
        const filterAccounts = () => {
            let newFilteredAccounts = [];
            for (const service in accounts) {
                newFilteredAccounts = [
                    ...newFilteredAccounts,
                    ...accounts[service].filter((acc) =>
                        acc.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        acc.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        acc.notes.toLowerCase().includes(searchTerm.toLowerCase())
                    ),
                ];
            }
            setFilteredAccounts(newFilteredAccounts);
        };
        filterAccounts();
    }, [searchTerm, accounts]);

    return (
        <ul id="accounts-list">
            {filteredAccounts.map((account) => (
                <div className="account-list-item" key={account.id}>
                    <p className="service">
                        {account.service}
                    </p>
                    <p className="username">
                        {account.username}
                    </p>
                </div>
            ))}
        </ul>
    )
}

export default UpdateList;
import { readTextFile } from "@tauri-apps/api/fs";
import React, { useState, useEffect } from "react";
import "./AccountsList.css";

import { getConfigValue } from "../Config/config";


export function UpdateList({ searchTerm }) {
    const [accountsDir, setAccountsDir] = useState("");
    const [accounts, setAccounts] = useState({});
    const [filteredAccounts, setFilteredAccounts] = useState([]);
    const [sortFilter, setSortFilter] = useState("");

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
    }, [searchTerm, accounts]);

    return (
        <div id="accounts-list-div">
            <div id="settings-utils">
                <button id="sort"
                 onClick={ () => setSortFilter("name") }
                ></button>
            </div>
            <ul id="accounts-list">
                {filteredAccounts.map((account) => (
                    <div className="account-list-item" key={account.id}>
                        <h3 className="account-item-info" id="service">
                            {account.service}
                        </h3>
                        <p className="account-item-info" id="username">
                            {account.username}
                        </p>
                        <p className="account-item-info" id="notes">
                            {account.notes}
                        </p>
                    </div>
                ))}
            </ul>
        </div>
    )
}

export default UpdateList;
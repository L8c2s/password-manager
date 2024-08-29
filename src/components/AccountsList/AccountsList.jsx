import { readTextFile } from "@tauri-apps/api/fs";
import React, { useState, useEffect } from "react";
import "./AccountsList.css";

import { getConfigValue, loadConfig, saveConfig } from "../Config/config";
import { getMsgLang } from "../Config/lang";


export function UpdateList({ searchTerm, setShowAccountInfo, selectedId, setSelectedId }) {
    const [accountsDir, setAccountsDir] = useState("");
    const [accounts, setAccounts] = useState({});
    const [filteredAccounts, setFilteredAccounts] = useState([]);
    const [defaultFilteredAccounts, setDefaultFilteredAccounts] = useState([]);
    const [classSortMessage, setClassSortMessage] = useState(false);
    const [sortMessage, setSortMessage] = useState("");
    const [langSet, setLangSet] = useState("");
    const [sortFilter, setSortFilter] = useState("");
    const [sortedBy, setSortedBy] = useState("");

    // service
    // username
    // password
    // notes
    // favorite
    // id
    // password_history
    // last_modified
    // created

    useEffect(() => {
        const loadDir = async () => {
            let dirSet = await getConfigValue("accounts_dir");
            setAccountsDir(`${dirSet}/accounts.json`);
        };

        const loadLang = async () => {
            setLangSet(await getConfigValue("lang"));
        }

        const loadFilter = async () => {
            // setSortFilter(await getConfigValue("sort_filter"));
        }

        loadDir();
        loadLang();
        loadFilter();
    }, [])

    useEffect(() => {
        if (!sortFilter) {
            setSortFilter("default");
        }
        sortAccounts();
    }, [sortFilter]);

    useEffect(() => {
        const loadAccounts = async () => {
            let accountsFile;
            try {
                accountsFile = await readTextFile(accountsDir);
            } catch {
                accountsFile = "{}";
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
        setDefaultFilteredAccounts(newFilteredAccounts);
    }, [searchTerm, accounts]);

    // useEffect(() => {
    //     sortAccounts();
    // }, [filteredAccounts, defaultFilteredAccounts])

    const jmpFilter = async () => {
        const sorters = [ "accountName", "serviceName", "lastModified", "created", "noFilter" ]
        const newSorter = sorters.at((sorters.indexOf(sortFilter) + 1) % sorters.length)
        setSortFilter(newSorter);

        setClassSortMessage("show");
        setTimeout(() => {
            setClassSortMessage("hidden");
        }, 500);

        let config = await loadConfig();
        config["sort_filter"] = newSorter;
        await saveConfig(config);
    }

    const sortAccounts = async () => {
        let newFilteredAccounts = [...filteredAccounts];
        if (sortFilter === "accountName") {
            newFilteredAccounts.sort((a, b) => a.username.localeCompare(b.username));
            setSortMessage(await getMsgLang(langSet, "AccountsList", "sort-message.username"))
        } else if (sortFilter === "serviceName") {
            newFilteredAccounts.sort((a, b) => a.service.localeCompare(b.service));
            setSortMessage(await getMsgLang(langSet, "AccountsList", "sort-message.service"))
        } else if (sortFilter === "created") {
            newFilteredAccounts.sort((a, b) => new Date(a.created) - new Date(b.created));
            setSortMessage(await getMsgLang(langSet, "AccountsList", "sort-message.created"))
        } else if (sortFilter === "lastModified") {
            newFilteredAccounts.sort((a, b) => new Date(a.last_modified) - new Date(b.last_modified));
            setSortMessage(await getMsgLang(langSet, "AccountsList", "sort-message.last-modified"))
        } else {
            setSortMessage(await getMsgLang(langSet, "AccountsList", "sort-message.no-filter"))
            newFilteredAccounts = [...defaultFilteredAccounts];
        }
        setFilteredAccounts(newFilteredAccounts);
        setSortedBy(sortFilter);
    }

    const accountSelected = (accountId) => {
        if (selectedId) {
            document.getElementById(selectedId).style = "";
            if (accountId === selectedId) {
                setSelectedId("");
                setShowAccountInfo(false);
                return null
            }
        }

        setSelectedId(accountId);
        setShowAccountInfo(true);
        document.getElementById(accountId).style = "border-bottom: 5px solid #196aff;";
    }

    // ------------------------------ //

    return (
        <div id="accounts-list-div">
            <div id="settings-utils">
                {
                    classSortMessage && (
                        <div className={classSortMessage} id="sort-message">
                            {sortMessage}
                        </div>
                    )
                }
                <button id="sort"
                 onClick={ () => jmpFilter() }
                ></button>
            </div>
            <ul id="accounts-list">
                {filteredAccounts.map((account) => (
                    <div className="account-list-item" id={account.id} key={account.id}
                     onClick={ () => {
                        accountSelected(account.id);
                     } }>
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
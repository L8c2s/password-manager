import { readTextFile } from "@tauri-apps/api/fs";
import React, { useState, useEffect } from "react";
import "./AccountsList.css";

import { getConfigValue, loadConfig, saveConfig } from "../Config/config";
import { getMsgLang } from "../Config/lang";
import { editAccount, editAccountKey, getAccount, getAccounts, setAccountFavorite } from "../Config/accountsManager/manager";


export function UpdateList({ accounts, setAccounts, searchTerm, setSearchTerm, showAccountInfo, setShowAccountInfo, selectedId, setSelectedId, favorite, setFavorite }) {
    const [accountsDir, setAccountsDir] = useState("");
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
        const loadLang = async () => {
            setLangSet(await getConfigValue("lang"));
        }

        const loadFilter = async () => {
            // setSortFilter(await getConfigValue("sort_filter"));
        }

        loadLang();
        loadFilter();
    }, [])

    useEffect(() => {
        if (!sortFilter) {
            setSortFilter("default");
        }
        sortAccounts();
    }, [sortFilter]);

    const setFilter = () => {
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
    }

    useEffect(() => {
        setFilter();
    }, [accounts]);

    useEffect(() => {
        setFilter();
    }, [searchTerm]);

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
            let accountDiv = document.getElementById(selectedId);
            if (accountDiv)
                accountDiv.style = "";

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
    
    useEffect(() => {
        if (!showAccountInfo && selectedId) {
            document.getElementById(selectedId).style = "";
            setSelectedId("");
        }
    }, [showAccountInfo])

    const updateFavoriteIcon = (accountId=null) => {
        if (!accountId && !selectedId) return;

        if (!accountId) {
            accountId = selectedId;
        }

        const account = getAccount(accounts, accountId );
        const accountListed = document.getElementById(`${account.id}btn`);

        const newClass = account.favorite ? "favorite" : "not-favorite";
        newClass === "favorite" ? accountListed.classList.remove("not-favorite") : accountListed.classList.remove("favorite");

        accountListed.classList.add(newClass);
    }

    const setFavoriteFromList = async (accountId, newFavorite) => {
        await setAccountFavorite(accounts, accountId, newFavorite);
        if (accountId === selectedId) setFavorite(newFavorite);
        updateFavoriteIcon(accountId);
    }

    useEffect(() => {
        filteredAccounts.map(async (acc) => {
            await setFavoriteFromList(acc.id, acc.favorite);
        })
    }, [filteredAccounts]);

    useEffect(() => {
        const updateFavoriteChangedId = async () => {
            let account = getAccount(accounts, selectedId);
            setFavoriteFromList(account.id, favorite);
        }

        if (!selectedId) return;
        updateFavoriteChangedId();
    }, [favorite]);

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
                    <div className="account-list-item" id={account.id} key={account.id}>
                        <div id="account-list-info"
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

                        <div id="div-favorite-button">
                            <button className="favorite-button not-favorite" id={`${account.id}btn`}
                             onClick={ async () => {
                                await setFavoriteFromList(account.id, !account.favorite);
                             } }></button>
                        </div>
                    </div>
                ))}
            </ul>
        </div>
    )
}

export default UpdateList;
import { readTextFile } from "@tauri-apps/api/fs";
import React, { useState, useEffect } from "react";
import "./AccountsList.css";

import { getConfigValue, loadConfig, saveConfig } from "../Config/config";
import { getMsgLang } from "../Config/lang";
import { editAccount, editAccountKey, getAccount, getAccounts, setAccountFavorite } from "../Config/accountsManager/manager";


// correct order:
// when accounts is modified, load defaultFilteredAccounts
// when defaultFilteredAccounts is modified, load searchTerm
// when sortFilter is modified, load filteredAccounts and filter using sortFilter
// when filteredAccounts is modified, move every favorite account to the top of the list
// when favorite is changed, call the above function again

export function UpdateList({ accounts, searchTerm, showAccountInfo, setShowAccountInfo, selectedId, setSelectedId, favorite, setFavorite }) {
    const [filteredAccounts, setFilteredAccounts] = useState([]);
    const [defaultFilteredAccounts, setDefaultFilteredAccounts] = useState([]);
    const [classSortMessage, setClassSortMessage] = useState(false);
    const [sortMessage, setSortMessage] = useState("");
    const [langSet, setLangSet] = useState("");
    const [sortFilter, setSortFilter] = useState("");
    const [fixedFilteredAccounts, setFixedFilteredAccounts] = useState([]);

    // id
    // service
    // username
    // password
    // notes
    // favorite
    // password_history
    // last_modified
    // created

    useEffect(() => {
        const loadLang = async () => {
            setLangSet(await getConfigValue("lang"));
        };

        loadLang();
    }, []);

    const filterAccounts = (accounts, searchTerm) => {
        return accounts.filter((acc) =>
            acc.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
            acc.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            acc.notes.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    useEffect(() => {
        let newFilteredAccounts = [];
        for (const service in accounts) {
            newFilteredAccounts.push(...accounts[service]);
        }

        setDefaultFilteredAccounts([...newFilteredAccounts]);

        const loadSortFilter = async () => {
            setSortFilter(await getConfigValue("sort_filter"));
        }

        loadSortFilter();
    }, [accounts]);

    const sortAccounts = async () => {
        let newFilteredAccounts = [...defaultFilteredAccounts];

        if (sortFilter === "accountName") {
            newFilteredAccounts.sort((a, b) => a.username.localeCompare(b.username));
            setSortMessage(await getMsgLang(langSet, "AccountsList", "sort-message.username"));
        } else if (sortFilter === "serviceName") {
            newFilteredAccounts.sort((a, b) => a.service.localeCompare(b.service));
            setSortMessage(await getMsgLang(langSet, "AccountsList", "sort-message.service"));
        } else if (sortFilter === "created") {
            newFilteredAccounts.sort((a, b) => new Date(a.created) - new Date(b.created));
            setSortMessage(await getMsgLang(langSet, "AccountsList", "sort-message.created"));
        } else if (sortFilter === "lastModified") {
            newFilteredAccounts.sort((a, b) => new Date(a.last_modified) - new Date(b.last_modified));
            setSortMessage(await getMsgLang(langSet, "AccountsList", "sort-message.last-modified"));
        } else {
            setSortMessage(await getMsgLang(langSet, "AccountsList", "sort-message.no-filter"))
        }

        let favoriteAccounts = newFilteredAccounts.filter((acc) => acc.favorite);
        let nonFavoriteAccounts = newFilteredAccounts.filter((acc) => !acc.favorite);

        setFilteredAccounts([...filterAccounts([...favoriteAccounts, ...nonFavoriteAccounts], searchTerm)]);
        setFixedFilteredAccounts([...favoriteAccounts, ...nonFavoriteAccounts]);

        let config = await loadConfig();
        config["sort_filter"] = sortFilter;
        await saveConfig(config, "sortAccounts");
    }

    useEffect(() => {
        sortAccounts();
    }, [sortFilter, defaultFilteredAccounts]);

    useEffect(() => {
        setFilteredAccounts([...filterAccounts(fixedFilteredAccounts, searchTerm)]);
    }, [searchTerm])

    const jmpFilter = async () => {
        const sorters = [ "accountName", "serviceName", "lastModified", "created", "noFilter" ];
        const newSorter = sorters.at((sorters.indexOf(sortFilter) + 1) % sorters.length);
        setSortFilter(newSorter);

        setClassSortMessage("show");

        let config = await loadConfig();
        config["sort_filter"] = newSorter;
        await saveConfig(config, "jmpFilter");
    };

    const accountSelected = (accountId) => {
        if (selectedId) {
            let accountDiv = document.getElementById(selectedId);
            if (accountDiv) {
                accountDiv.style = "";
            }

            if (accountId === selectedId) {
                setSelectedId("");
                setShowAccountInfo(false);
                return null;
            }
        }

        setSelectedId(accountId);
        setShowAccountInfo(true);
        document.getElementById(accountId).style = "border-bottom: 5px solid #196aff;";
    };

    useEffect(() => {
        if (!showAccountInfo && selectedId) {
            document.getElementById(selectedId).style = "";
            setSelectedId("");
        }
    }, [showAccountInfo]);

    const updateFavoriteIcon = (accountId = null) => {
        if (!accountId) {
            return updateFavoriteIcon(selectedId);
        }

        const account = getAccount(accounts, accountId);
        const accountListed = document.getElementById(`${account.id}btn`);

        const newClass = account.favorite ? "favorite" : "not-favorite";
        newClass === "favorite" ? accountListed.classList.remove("not-favorite") : accountListed.classList.remove("favorite");

        accountListed.classList.add(newClass);
    };
    
    const favoriteFirst = () => {
        let favoriteAccounts = filteredAccounts.filter((acc) => acc.favorite);
        let nonFavoriteAccounts = filteredAccounts.filter((acc) => !acc.favorite);
        setFilteredAccounts([...favoriteAccounts, ...nonFavoriteAccounts]);
    }

    useEffect(() => {   
        // favoriteFirst();
        sortAccounts();
        setFilteredAccounts([...filterAccounts(filteredAccounts, searchTerm)]);
    }, [favorite]);

    useEffect(() => {
        filteredAccounts.map((acc) => {
            updateFavoriteIcon(acc.id);
        });
    }, [filteredAccounts]);

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
                 onMouseOver={ () => setClassSortMessage("show") }
                 onMouseOut={ () => setClassSortMessage("hidden") }
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
                                setFavorite([account.id, !account.favorite]);
                             } }></button>
                        </div>
                    </div>
                ))}
            </ul>
        </div>
    )
}

export default UpdateList;

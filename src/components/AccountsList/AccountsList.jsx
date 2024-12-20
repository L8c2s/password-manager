import React, { useState, useEffect } from "react";

import { editAccount, editAccountKey, getAccount, saveAccounts } from "../Config/accountsManager/manager";
import { setKey } from "../Config/config";


export function UpdateList({ accounts, searchTerm, showAccountInfo, setShowAccountInfo, selectedId, setSelectedId, favorite, setFavorite, langFile, config }) {
    const [defaultFilteredAccounts, setDefaultFilteredAccounts] = useState([]);
    const [sortFilter, setSortFilter] = useState("");
    const [filteredAccounts, setFilteredAccounts] = useState([]);
    const [classSortMessage, setClassSortMessage] = useState("hidden");
    const [sortMessage, setSortMessage] = useState("");
    const [fixedFilteredAccounts, setFixedFilteredAccounts] = useState([]);

    useEffect(() => {
        // loops through all the accounts in the list of all services and adds the account object in the list
        if (!accounts) return;

        let newDefaultList = [];
        for (const service in accounts) {
            accounts[service].forEach(acc => {
                newDefaultList.push(acc);
            });
        }

        setDefaultFilteredAccounts([...newDefaultList]);
        // load the last list filter used in the previous interaction with the program
        setSortFilter(config.sort_filter ? config.sort_filter : "serviceName");
    }, [accounts]);

    useEffect(() => {
        // when defaultFilteredAccounts and sortFilter is loaded,
        // use both to create fixedFilteredAccounts
        // it's basically all accounts listed in a different order
        // sortFilter determines this order

        if (favorite) {
            updateFavorite();
            sortAccounts();
        }

        if (!sortFilter) return;
        setKey("sort_filter", sortFilter);
    }, [defaultFilteredAccounts, sortFilter, favorite]);

    const updateFavorite = () => {
        editAccountKey(accounts, favorite[0], "favorite", favorite[1]);
    }

    useEffect(() => {
        // when fixedFilteredAccounts finished loading the filteredAccounts list must
        // load too so it can be rendered
        // also applies the searchTerm here
        setFilteredAccounts([...filterAccounts([...fixedFilteredAccounts], searchTerm)]);
    }, [searchTerm, fixedFilteredAccounts]);

    useEffect(() => {
        // always checks the selectedId because when the user searches and the selected item disappears the program loses track of
        // what item was selected in the list
        if (selectedId) {
            try {
                document.getElementById(selectedId).style.borderBottom = "5px solid #196aff";
            } catch {}
        }

    }, [filteredAccounts]);

    useEffect(() => {
        // if the AccountInfo component is closed using the x button,
        // change the account selected in the list to be unselected
        if (!showAccountInfo) {
            const lastAccount = document.getElementById(selectedId);
            if (!lastAccount) return;
            lastAccount.style.borderBottom = "";
            setSelectedId("");
        }
    }, [showAccountInfo]);

    const sortByDate = (date1, date2) => {
        // checks the dates to find the greater
        const firstDate = new Date(date1);
        const secondDate = new Date(date2);

        return secondDate - firstDate;
    }

    const sortAccounts = async () => {
        // await new Promise(resolve => setTimeout(resolve, 100));
        // use defaultFilteredAccounts as reference to filter all accounts
        let newFilteredAccounts = [...defaultFilteredAccounts];

        if (sortFilter === "accountName") {
            newFilteredAccounts.sort((a, b) => a.username.localeCompare(b.username));
            setSortMessage(langFile.titles.sortUsername);
        } else if (sortFilter === "serviceName") {
            newFilteredAccounts.sort((a, b) => a.service.localeCompare(b.service));
            setSortMessage(langFile.titles.sortService);
        } else if (sortFilter === "created") {
            newFilteredAccounts.sort((a, b) => sortByDate(a.created, b.created));
            setSortMessage(langFile.titles.sortCreated);
        } else if (sortFilter === "lastModified") {
            newFilteredAccounts.sort((a, b) => sortByDate(a.last_modified, b.last_modified));
            setSortMessage(langFile.titles.sortLastModified);
        } else {
            setSortMessage(langFile.titles.sortNoFilter)
        }

        let favoriteAccounts = newFilteredAccounts.filter((acc) => acc.favorite);
        let nonFavoriteAccounts = newFilteredAccounts.filter((acc) => !acc.favorite);

        setFixedFilteredAccounts([...favoriteAccounts, ...nonFavoriteAccounts]);
    };

    const filterAccounts = (accs, term) => {
        if (!term) return accs;

        return accs.filter((acc) =>
            acc.service.toLowerCase().includes(term.toLowerCase()) ||
            acc.username.toLowerCase().includes(term.toLowerCase()) ||
            acc.notes.toLowerCase().includes(term.toLowerCase())
        );
    };

    const jmpFilter = async () => {
        // update the filter in loop
        const sorters = [ "accountName", "serviceName", "lastModified", "created", "noFilter" ];
        const newSorter = sorters.at((sorters.indexOf(sortFilter) + 1) % sorters.length);
        setSortFilter(newSorter);
    };

    const accountSelected = (accountId) => {
        // set the selectedId to the ID of the account selected in the list
        if (selectedId) {
            // if selectedId is not empty, change the style of the border of the item to be unselected
            const accountDiv = document.getElementById(selectedId);
            if (accountDiv) {
                accountDiv.style.borderBottom = "";
            }
            // if the account selected is the same that was selected before, set the selectedId to unselected and hide the account info
            if (accountId === selectedId) {
                setSelectedId("");
                setShowAccountInfo(false);
                return;
            }
        }

        // update the selected account
        setSelectedId(accountId);
        setShowAccountInfo(true);
        document.getElementById(accountId).style.borderBottom = "5px solid #196aff";
    };

    return (
        <div id="accounts-list-div">
            <div id="list-utils-div">
                <div id="utils-left"></div>

                <div id="utils-right">
                    <div className={classSortMessage} id="sort-message">{sortMessage}</div>

                    <button id="sort"
                     onClick={ () => jmpFilter() }
                     onMouseOver={ () => setClassSortMessage("show") }
                     onMouseOut={ () => setClassSortMessage("hidden") }></button>

                </div>
            </div>

            <div id="accounts-list">
                {!filteredAccounts.length ?
                    <div id="create-account-tip-div">
                        <p id="create-account-tip">{langFile.messages.newAccountTip0}</p>
                    </div> 
                    :
                    (<div id="list">
                        {filteredAccounts && filteredAccounts.map(account => (
                            <div className="account-list-item" id={account.id} key= {account.id}>
                                <div className="align-info">
                                    <div className="account-list-info" onClick={() => {
                                        accountSelected(account.id);
                                    }}>
                                        <h3 className="account-service-info account-item-info">{account.service}</h3>
                                        <p className="account-username-info account-item-info">{account.username}</p>
                                        <p className="account-notes-info account-item-info">{account.notes}</p>
                                    </div>

                                    <div className="account-favorite-button">
                                        <button className={`favorite-button ${account.favorite ? "favorite" : "not-favorite"}`} id={`${account.id}btn`} onClick={e => {
                                            setFavorite([account.id, !account.favorite]);

                                            const newClass = !account.favorite ? "favorite" : "not-favorite";
                                            newClass === "favorite" ? e.target.classList.remove("not-favorite") : e.target.classList.remove("favorite");

                                            e.target.classList.add(newClass);
                                        }}></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default UpdateList;

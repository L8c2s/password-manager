import React, { useState, useEffect } from "react";

import { getAccount } from "../Config/accountsManager/manager";
import { setKey } from "../Config/config";


export function UpdateList({ accounts, searchTerm, showAccountInfo, setShowAccountInfo, selectedId, setSelectedId, favorite, setFavorite, langFile, config }) {
    const [defaultFilteredAccounts, setDefaultFilteredAccounts] = useState([]);
    const [sortFilter, setSortFilter] = useState("");
    const [filteredAccounts, setFilteredAccounts] = useState([]);
    const [classSortMessage, setClassSortMessage] = useState("hidden");
    const [sortMessage, setSortMessage] = useState("");
    const [fixedFilteredAccounts, setFixedFilteredAccounts] = useState([]);
    const [lastSelectedId, setLastSelectedId] = useState(selectedId);

    useEffect(() => {
        // load the last list filter used in the previous interaction with the program
        const loadSortFilter = async () => {
            setSortFilter(config.sort_filter);
        };

        // loops through all the accounts in the list of all services and adds the account object in the list
        if (!accounts) return;
        let newDefaultList = [];
        for (const service in accounts) {
            accounts[service].forEach(acc => {
                newDefaultList.push(acc);
            });
        }

        setDefaultFilteredAccounts([...newDefaultList]);
        loadSortFilter();
    }, [accounts]);

    useEffect(() => {
        // when defaultFilteredAccounts and sortFilter is loaded,
        // use both to create fixedFilteredAccounts
        // it's basically all accounts listed in a different order
        // sortFilter determines this order

        const updateConfig = async () => {
            await setKey("sort_filter", sortFilter);
        }

        sortAccounts();
        if (!sortFilter) return
        updateConfig();
    }, [defaultFilteredAccounts, sortFilter, favorite]);

    useEffect(() => {
        // when fixedFilteredAccounts finished loading the filteredAccounts list must
        // load too so it can be rendered
        // also applies the searchTerm here
        setFilteredAccounts([...filterAccounts([...fixedFilteredAccounts], searchTerm)]);
    }, [searchTerm, fixedFilteredAccounts]);

    useEffect(() => {
        // since filteredAccounts is done to be rendered
        // use the updateFavoriteIcon function to update the icon favorite icon of the account in the list
        filteredAccounts.forEach(acc => {
            updateFavoriteIcon(acc.id);
        });

        if (selectedId) {
            try {
                document.getElementById(selectedId).style = "border-bottom: 5px solid #196aff;";
            } catch {}
        }

    }, [filteredAccounts]);

    useEffect(() => {
        // if the AccountInfo component is closed using the x button,
        // change the account selected in the list to be unselected
        if (!selectedId && lastSelectedId) {
            const lastAccount = document.getElementById(lastSelectedId);
            if (!lastAccount) return;
            lastAccount.style = "";
            setLastSelectedId("");
        } else if (selectedId && lastSelectedId !== selectedId) {
            setLastSelectedId(selectedId);
        }
    }, [selectedId]);

    const sortByDate = (date1, date2) => {
        // checks the dates to find the greater
        const firstDate = new Date(date1);
        const secondDate = new Date(date2);

        return secondDate - firstDate;
    }

    const sortAccounts = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
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

    const updateFavoriteIcon = (accountId = null) => {
        // updated the class of the favorite icon in the list
        // so it can be the red icon when the account is favorite and white icon when is is not favorite
        if (!accountId) {
            return updateFavoriteIcon(selectedId);
        }

        const account = getAccount(accounts, accountId);
        const accountListed = document.getElementById(`${account.id}btn`);

        if (!accountListed) return;

        const newClass = account.favorite ? "favorite" : "not-favorite";
        newClass === "favorite" ? accountListed.classList.remove("not-favorite") : accountListed.classList.remove("favorite");

        accountListed.classList.add(newClass);
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
                accountDiv.style = "";
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
        document.getElementById(accountId).style = "border-bottom: 5px solid #196aff;";
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
                                        <button className="favorite-button not-favorite" id={`${account.id}btn`} onClick={async () => {
                                            setFavorite([account.id, !account.favorite]);
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

import React from "react";
import "./AccountsList.css";


export function UpdateList({ searchTerm }) {
    const accounts = [
        { id: 0, service: "Google", username: "email@exam.ple", password: "123456", notes: "my first account" },
        { id: 1, service: "Microsoft", username: "email@exam.ple", password: "123456", notes: "my second account" },
        { id: 2, service: "Twitch", username: "email@exam.ple", password: "123456", notes: "my twitch account" },
        { id: 3, service: "Twitter", username: "email@exam.ple", password: "123456", notes: "my twitter account" },
    ]

    const filteredAccounts = accounts.filter((account) => 
        account.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.notes.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <ul>
            {filteredAccounts.map((account) => (
                <div className="account-list-item" key={account.id}>{account.service}</div>
            ))}
        </ul>
    )
}

export default UpdateList;
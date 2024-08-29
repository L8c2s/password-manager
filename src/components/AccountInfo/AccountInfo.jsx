import { React, useEffect, useState } from "react";


import { getConfigValue } from "../Config/config";
import { getMsgLang } from "../Config/lang";


export function AccountsInfo({ showAccountInfo, setShowAccountInfo, selectedId, setSelectedId }) {
    return (
        <div id="accounts-info-div">
            <div id="info-nav"></div>
        </div>
    );
}

export default AccountsInfo;
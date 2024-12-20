import { React, useEffect, useState } from "react";


export function FloatingArea({ setAddAccount, afterEditAccount, setSettingsPopup }) {
    const [isButtonVisible, setIsButtonVisible] = useState(true);
    
    const openAddAccount = async () => {
        setAddAccount(true);
    }

    useEffect(() => {
        const handleScroll = () => {
            let isVisible = true;

            console.log("innerHeight: ", window.innerHeight)
            console.log("scrollY: ", window.scrollY);
            console.log("scrollHeight: ", document.body.scrollHeight);

            if (window.innerHeight + window.scrollY >= document.body.scrollHeight) {
                isVisible = false;
            } else {
                isVisible = true;
            }

            setIsButtonVisible(isVisible)
        }

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div id="floating-div" style={{ display: isButtonVisible ? "flex" : "none" }}>
            <div id="floating-div-utils">
                <div id="add-account-floating-div" className="floating-div-area">
                    <button id="add-account-floating-button" onClick={ () => openAddAccount() }></button>
                </div>

                <div id="recovery-floating-button-div" className="floating-div-area" style={{ display: afterEditAccount ? "block" : "none" }}>
                    <button id="recovery-floating-button" onClick={ () => setSettingsPopup(true) }></button>
                </div>
            </div>

        </div>
    );
}
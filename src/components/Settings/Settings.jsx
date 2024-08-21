import { React, useEffect } from "react";
import "./Settings.css";


export function Settings({ settingsPopup, setSettingsPopup }) {
    useEffect(() => {
        const on = () => {
            let settings_full_window = document.getElementById("settings-full-window");
            settings_full_window.style.display = "block";
            settings_full_window.className = "zoom-in";
        }

        const off = () => {
            let settings_full_window = document.getElementById("settings-full-window");
            settings_full_window.className = "zoom-out";
            settings_full_window.style.display = "none";
        }

        if (settingsPopup) {
            on()
        } else {
            off()
        }
    }, [settingsPopup])

    return (
        <div id="settings-full-window">
            <div id="settings-blur"
                onClick={ () => { setSettingsPopup(false) } }
            ></div>

            <div id="settings-window">
                Hello World!
            </div>
        </div>
    );
}

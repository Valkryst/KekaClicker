import {KekaAPI} from "../../../js/api.js";
import {getStoredValue, SUBDOMAIN_STORE_KEY} from "../../../element/input/_.js";

/** Closes the popup window after a short delay. */
function closeWindow() {
    setTimeout(window.close, 50);
}

function logAndNotify(error, message) {
    console.error(error);
    new Notification(message);
}

/** Opens the extension options page after a short delay. */
function openOptions() {
    setTimeout(chrome.runtime.openOptionsPage, 50);
}

// Establish connection with background script.
const port = chrome.runtime.connect({name: "KekaClicker"});

// Check if the subdomain is set; if not, prompt the user to set it.
const subdomain = await getStoredValue(SUBDOMAIN_STORE_KEY);
if (!subdomain) {
    new Notification("Keka subdomain is not set. Please set it in the extension options.");
    openOptions();
}

// Check if the API Token is still valid; if not, attempt to refresh it.
const keka = await KekaAPI.create();
if (!(await keka.isTokenValid())) {
    try {
        await keka.refreshToken();
    } catch (error) {
        logAndNotify(error, "Failed to refresh API token. Are you logged into Keka?");
        closeWindow();
    }
}

// Handle Clock In/Out button click.
const clockInOutButton = document.querySelector("x-clock-inout-button");
clockInOutButton.addEventListener("click", async () => {
    clockInOutButton.setEnabled(false);

    keka.clockInOut()
        .then(isClockedIn => {
            document.querySelector("x-clocked-status")
                .updateDisplay(isClockedIn)
                .then(() => clockInOutButton.setEnabled(true))
        })
        .catch(error => {
            logAndNotify(error, "Failed to clock in/out.");
            closeWindow();
        })
        .finally(() => clockInOutButton.setEnabled(true));
});
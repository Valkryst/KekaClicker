import {KekaAPI} from "../../../js/api.js";
import {getStoredValue, SUBDOMAIN_STORE_KEY} from "../../../js/storage.js";
import {sendNotification} from "../../../js/notification.js";

/** Closes the popup window after a short delay. */
function closeWindow() {
    setTimeout(window.close, 50);
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
    await sendNotification(chrome.i18n.getMessage("popupFailedNoSubdomainSet"), "error");
    openOptions();
}

// Check if the API Token is still valid; if not, attempt to refresh it.
const keka = await KekaAPI.create();
const clockInOutButton = document.querySelector("x-attendance-toggle");

keka.isTokenValid()
    .then(async isTokenValid => {
        if (isTokenValid) {
            clockInOutButton.setEnabled(true);
        } else {
            try {
                await keka.refreshToken();
                clockInOutButton.setEnabled(true);
                document.querySelector("x-attendance-status").updateDisplay();
                document.querySelector("x-attendance-time").updateDisplay();
            } catch (error) {
                await sendNotification(chrome.i18n.getMessage("popupFailedToRefreshToken"), "error", error);
                closeWindow();
            }
        }
    })
    .catch(async error => {
        await sendNotification(chrome.i18n.getMessage("popupFailedToValidateToken"), "error", error);
        closeWindow();
    });

// Handle Clock In/Out button click.
clockInOutButton.addEventListener("click", async () => {
    clockInOutButton.setEnabled(false);

    try {
        const isClockedIn = await keka.clockInOut();
        document.querySelector("x-attendance-status").updateDisplay(isClockedIn);
    } catch (error) {
        await sendNotification(chrome.i18n.getMessage("popupFailedToToggleAttendance"), "error", error);
        closeWindow();
    } finally {
        clockInOutButton.setEnabled(true);
    }
});
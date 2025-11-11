import {KekaAPI} from "../../../js/api.js";
import {getStoredValue, SUBDOMAIN_STORE_KEY} from "../../../element/input/_.js";

const STATUS_ELEMENT = document.querySelector("#clockInStatus");
const CLOCK_BUTTON = document.querySelector("#clockInOutButton");

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

/**
 * Updates the clock-in status display.
 *
 * @param isClockedIn {boolean} Whether the user is clocked in.
 */
function updateStatus(isClockedIn) {
    if (isClockedIn) {
        STATUS_ELEMENT.textContent = "Clocked-In";
        STATUS_ELEMENT.style.color = "lime";
    } else {
        STATUS_ELEMENT.textContent = "Clocked-Out";
        STATUS_ELEMENT.style.color = "red";
    }

    CLOCK_BUTTON.attributes.removeNamedItem("disabled");
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

// Retrieve and display the clock-in status.
keka.isClockedIn()
    .then(isClockedIn => updateStatus(isClockedIn))
    .catch(error => {
        logAndNotify(error, "Failed to retrieve clock-in status.");
        closeWindow();
    });

// Retrieve and display the hours worked.
keka.getEffectiveHours()
    .then(effectiveHours => document.querySelector("#effectiveHours").textContent = effectiveHours)
    .catch(error => logAndNotify(error, "Failed to retrieve effective hours."))

// Handle Clock In/Out button click.
document.querySelector("#clockInOutButton").addEventListener("click", async () => {
    CLOCK_BUTTON.setAttribute("disabled", "true");

    STATUS_ELEMENT.textContent = "Loading...";
    STATUS_ELEMENT.text.color = "inherit";

    keka.clockInOut()
        .then(isClockedIn => updateStatus(isClockedIn))
        .catch(error => {
            logAndNotify(error, "Failed to clock in/out.");
            closeWindow();
        })
        .finally(() => CLOCK_BUTTON.attributes.removeNamedItem("disabled"))
});
import {KekaAPI} from "../../../js/api.js";
import {getStoredValue, SUBDOMAIN_STORE_KEY} from "../../../element/input/_.js";

// Establish connection with background script.
const port = chrome.runtime.connect({name: "KekaClicker"});

// Check if the subdomain is set; if not, prompt the user to set it.
const subdomain = await getStoredValue(SUBDOMAIN_STORE_KEY);
if (!subdomain) {
    new Notification("Keka subdomain is not set. Please set it in the extension options.");
    setTimeout(() => { // Delay to ensure notification is shown before opening options.
        chrome.runtime.openOptionsPage();
    }, 50);
}

// Check if the API Token is still valid; if not, attempt to refresh it.
const keka = await KekaAPI.create();
if (!(await keka.isTokenValid())) {
    try {
        await keka.refreshToken();
    } catch (error) {
        console.error(error);
        new Notification("Failed to refresh API token. Are you logged into Keka?");
        setTimeout(() => { // Delay to ensure notification is shown before closing.
            window.close();
        }, 50);
    }
}

// Immediately check if the user is clocked-in to Keka when the popup opens.
const statusElement = document.querySelector("#clockInStatus");
if (await keka.isClockedIn()) {
    statusElement.textContent = "Clocked-In";
    statusElement.style.color = "lime";
} else {
    statusElement.textContent = "Clocked-Out";
    statusElement.style.color = "red";
}
document.querySelector("#clockInOutButton").attributes.removeNamedItem("disabled");

// Retrieve and display the effective hours:
keka.getEffectiveHours()
    .then(effectiveHours => {
        document.querySelector("#effectiveHours").textContent = effectiveHours;
    })
    .catch(error => {
        console.error("Failed to retrieve effective hours:", error);
    })

// Handle Clock In/Out button click.
document.querySelector("#clockInOutButton").addEventListener("click", async () => {
    const button = document.querySelector("#clockInOutButton");
    button.setAttribute("disabled", "true");

    statusElement.textContent = "Loading...";

    try {
        if (await keka.clockInOut()) {
            statusElement.textContent = "Clocked-In";
            statusElement.style.color = "lime";
        } else {
            statusElement.textContent = "Clocked-Out";
            statusElement.style.color = "red";
        }
    } catch (error) {
        console.error(error);
        new Notification("Failed to clock in/out.");
        setTimeout(() => { // Delay to ensure notification is shown before closing.
            window.close();
        }, 50);
    } finally {
        button.attributes.removeNamedItem("disabled");
    }
});
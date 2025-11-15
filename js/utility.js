import {getStoredValue, SUBDOMAIN_STORE_KEY} from "./storage.js";

/**
 * Amount of time to wait between polling checks, in milliseconds.
 * @type {number}
 */
const POLL_CHECK_INTERVAL = 100;

/**
 * Maximum amount of time to wait for polling operations, in milliseconds.
 * @type {number}
 */
const POLL_CHECK_TIMEOUT = 6000;

/**
 * Attempts to retrieve Keka's API token from a background tab.
 *
 * @returns {Promise<string>}
 * @throws Error If the subdomain cannot be retrieved, the token is not found, or any tab operations fail.
 */
export async function getToken() {
    const tab = await openKeka();
    try {
        await waitForTabLoad(tab.id);
        return await pollForToken(tab.id);
    } finally {
        if (tab.id) {
            chrome.tabs.remove(tab.id);
        }
    }
}

/**
 * Attempts to open Keka in a new background tab.
 *
 * @return {Promise<chrome.tabs.Tab>} The created tab object.
 * @throws {Error} If the subdomain cannot be retrieved or the tab fails to open.
 */
export async function openKeka() {
    const subdomain = await getStoredValue(SUBDOMAIN_STORE_KEY);
    if (!subdomain) {
        throw new Error("Please set your Keka subdomain in the extension options.");
    }

    const tab = await chrome.tabs.create({url: `https://${subdomain}.keka.com/#/home/dashboard`, active: false});
    if (!tab?.id) {
        throw new Error("Failed to open Keka in a background tab.");
    }

    chrome.runtime.sendMessage({type: "SET_ACTIVE_TAB", tabId: tab.id});
    return tab;
}

/**
 * Polls the specified tab's localStorage for the presence of an access token.
 *
 * @param tabId {number} ID of the tab to poll.
 * @returns {Promise<string>} Retrieved access token.
 * @throws {Error} If the token is not found within the timeout period.
 */
async function pollForToken(tabId) {
    const start = Date.now();
    while (Date.now() - start < POLL_CHECK_TIMEOUT) {
        const [{result: token}] = await chrome.scripting.executeScript({
            target: {tabId},
            func: () => localStorage.getItem("access_token"),
        });
        if (token) return token;
        await new Promise(resolve => setTimeout(resolve, POLL_CHECK_INTERVAL));
    }
    throw new Error("Token not found within timeout.");
}

/**
 * Waits for the specified tab to finish loading.
 *
 * @param tabId {number} ID of the tab to monitor.
 * @returns {Promise<unknown>}
 * @throws {Error} If tab fails to load.
 */
async function waitForTabLoad(tabId) {
    return new Promise((resolve) => {
        const listener = (updatedTabId, changeInfo) => {
            if (updatedTabId === tabId && changeInfo.status === "complete") {
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
            }
        };
        chrome.tabs.onUpdated.addListener(listener);
    });
}
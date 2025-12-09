let activeTabId = null;

chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== "popup") {
        return;
    }

    port.onDisconnect.addListener(() => {
        if (activeTabId) {
            chrome.tabs.remove(activeTabId);
            activeTabId = null;
        }
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "SET_ACTIVE_TAB") {
        activeTabId = message.tabId;
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CLEAR_ACTIVE_TAB") {
        activeTabId = null;
    }
});
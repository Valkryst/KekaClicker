chrome.runtime.onConnect.addListener(async (port) => {
    if (port.name !== "popup") {
        return;
    }

    port.onDisconnect.addListener(async () => {
        const {activeTabId} = await chrome.storage.local.get("activeTabId");
        if (activeTabId) {
            await chrome.tabs.remove(activeTabId);
            await chrome.storage.local.remove("activeTabId");
        }
    });
});
/**
 * This script should be declared at the end of an HTML document. It will automatically check all text elements for
 * textContent containing "__MSG_localizationKey__" placeholders, and auto-replace them with their localized strings.
 */
const regex = /__MSG_([A-Za-z0-9_]+)__/g;
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

let node;
while (node = walker.nextNode()) {
    if (!node.nodeValue) {
        continue;
    }

    node.nodeValue = node.nodeValue.replace(regex, (_, key) => {
        console.log(key)
        console.log(chrome.i18n.getMessage(key))
        return chrome.i18n.getMessage(key)?.trim() || "Unknown";
    });
}

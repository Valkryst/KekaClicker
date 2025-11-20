/**
 * This script should be declared at the end of an HTML document. It will automatically check all text elements for
 * textContent containing "__MSG_localizationKey__" placeholders, and auto-replace them with their localized strings.
 */

function localize(text) {
    if (!text) {
        return "Unknown";
    }

    return text.replace(/__MSG_([A-Za-z0-9_]+)__/g, (match, key) => {
        return chrome.i18n.getMessage(key)?.trim() || "Unknown";
    });
}

// Localize <title>.
const titleElement = document.querySelector("title");
if (titleElement?.textContent) {
    titleElement.textContent = localize(titleElement.textContent);
}

// Localize text nodes in the document body.
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
let node;
while (node = walker.nextNode()) {
    if (!node.nodeValue) {
        continue;
    }

    node.nodeValue = localize(node.nodeValue);
}

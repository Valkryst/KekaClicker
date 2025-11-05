const REQUIRED_PERMISSIONS = ["Notifications", "Scripting", "Storage", "Tabs"];

/**
 * Determines whether the specified permission has been granted.
 *
 * @param permission {string} Name of the permission to check.
 * @returns {Promise<boolean>} A promise that resolves if the permission is granted, or rejects if not.
 */
export function hasPermission(permission) {
    if (!permission || typeof permission !== "string") {
        throw new Error("Invalid permission string provided.");
    }

    return new Promise((resolve, reject) => {
        chrome.permissions.contains({permissions: [permission]}, (result) => {
            if (result) {
                resolve(result);
            } else {
                reject(new Error("Permission is not granted."));
            }
        });
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const statusDiv = document.getElementById("permission-statuses");
    if (!statusDiv) {
        console.error("Unable to find 'permission-statuses' div.");
        return;
    }

    for (const permission of REQUIRED_PERMISSIONS) {
        const element = document.createElement("p");

        try {
            await hasPermission(permission.toLowerCase());
            element.textContent += "✅";
        } catch (e) {
            element.textContent += "❌";
        }

        element.textContent += " " + permission;
        statusDiv.appendChild(element);
    }
});
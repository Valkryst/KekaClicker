/**
 * Sends a browser notification to the user, with the specified message and log level.
 *
 * If the log level is "error" and an error object is provided, the error will be logged to the console.
 *
 * @param message {string} Message to display in the notification.
 * @param level {"info" | "warn" | "error"} Notification level. Defaults to "info".
 * @param error {Error} Error to log. Defaults to null.
 * @returns {Promise<void>} Promise that resolves when the notification is sent.
 */
export async function sendNotification(message, level = "info", error = null) {
    if (level === "error" && error) {
        console.error(error);
    } else if (level) {
        console[level](message);
    }

    await chrome.notifications.create({
        type: "basic",
        iconUrl: "/resources/favicon/512.png",
        title: "KekaClicker",
        message: message
    });
}
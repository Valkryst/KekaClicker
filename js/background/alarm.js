import {KekaAPI} from "../api.js";
import {getStoredValue, AUTO_CLOCK_IN_TIME_KEY, AUTO_CLOCK_OUT_TIME_KEY, AUTO_CLOCK_IN_ENABLED_KEY, AUTO_CLOCK_OUT_ENABLED_KEY} from "../storage.js";

const ALARM_NAME = "clockOutReminder";

const EIGHT_HOURS_IN_SECONDS = 8 * 60 * 60;

chrome.runtime.onInstalled.addListener(async () => {
    const hasAlarm = await chrome.alarms.get(ALARM_NAME);

    if (!hasAlarm) {
        console.log("Recreated")
        chrome.alarms.create(ALARM_NAME, {periodInMinutes: 1});
    }
})

chrome.alarms.onAlarm.addListener(async alarm => {
    if (alarm.name !== ALARM_NAME) {
        return;
    }

    const api = await KekaAPI.create();

    // Clock-out reminder
    if (await api.isClockedIn()) {
        if ((await api.getTimeClocked()) >= EIGHT_HOURS_IN_SECONDS) {
            chrome.notifications.create(
                ALARM_NAME,
                {
                    buttons: [
                        {title: chrome.i18n.getMessage("attendanceToggle")}
                    ],
                    iconUrl: "/resources/favicon/512.png",
                    message: chrome.i18n.getMessage("clockOutReminderMessage"),
                    title: chrome.i18n.getMessage("clockOutReminderTitle"),
                    type: "basic"
                }
            );
        }
    }

    // Auto clock-in/out
    await handleAutoClock(api);
});

/**
 * Handles automatic clock-in and clock-out.
 *
 * @param {KekaAPI} api Keka API instance.
 */
async function handleAutoClock(api) {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    if (day === 0 || day === 6) {
        return; // Only Monday to Friday
    }

    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    const [clockInEnabled, clockInTime, clockOutEnabled, clockOutTime] = await Promise.all([
        getStoredValue(AUTO_CLOCK_IN_ENABLED_KEY),
        getStoredValue(AUTO_CLOCK_IN_TIME_KEY),
        getStoredValue(AUTO_CLOCK_OUT_ENABLED_KEY),
        getStoredValue(AUTO_CLOCK_OUT_TIME_KEY)
    ]);

    const isClockedIn = await api.isClockedIn();

    if (clockInEnabled && clockInTime && currentTime === clockInTime && !isClockedIn) {
        try {
            await api.clockInOut();
            console.log("Auto clocked in at", currentTime);
        } catch (error) {
            console.error("Failed to auto clock in:", error);
        }
    } else if (clockOutEnabled && clockOutTime && currentTime === clockOutTime && isClockedIn) {
        try {
            await api.clockInOut();
            console.log("Auto clocked out at", currentTime);
        } catch (error) {
            console.error("Failed to auto clock out:", error);
        }
    }
}

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
   if (notificationId === ALARM_NAME) {
       await (await KekaAPI.create()).clockInOut();
   }
});
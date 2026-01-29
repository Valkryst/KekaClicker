import {KekaAPI} from "../../api.js";
import {getStoredValue, AUTO_CLOCK_IN_TIME_KEY, AUTO_CLOCK_OUT_TIME_KEY, AUTO_CLOCK_IN_ENABLED_KEY, AUTO_CLOCK_OUT_ENABLED_KEY} from "../../storage.js";
import {sendNotification} from "../../notification.js";

const ALARM_NAME = "automaticClockInOut";

chrome.runtime.onInstalled.addListener(async () => {
    const hasAlarm = await chrome.alarms.get(ALARM_NAME);

    if (!hasAlarm) {
        chrome.alarms.create(ALARM_NAME, {periodInMinutes: 1});
    }
})

chrome.alarms.onAlarm.addListener(async alarm => {
    if (alarm.name !== ALARM_NAME) {
        return;
    }

    const api = await KekaAPI.create();
    await handleAutoClock(api);
});

/**
 * Handles automatic clock-in and clock-out.
 *
 * @param {KekaAPI} api Keka API instance.
 */
async function handleAutoClock(api) {
    if (!isWeekday()) {
        return;
    }

    const currentTime = getFormattedTime();

    const [clockInEnabled, clockInTime, clockOutEnabled, clockOutTime] = await Promise.all([
        getStoredValue(AUTO_CLOCK_IN_ENABLED_KEY),
        getStoredValue(AUTO_CLOCK_IN_TIME_KEY),
        getStoredValue(AUTO_CLOCK_OUT_ENABLED_KEY),
        getStoredValue(AUTO_CLOCK_OUT_TIME_KEY)
    ]);

    const isClockedIn = true;

    const clockInCondition = clockInEnabled && clockInTime && currentTime === "20:21" && !isClockedIn;
    const clockOutCondition = clockOutEnabled && clockOutTime && currentTime === "21:08" && isClockedIn;

    console.debug(`Clock-in condition: ${clockInCondition}. Clock-out condition: ${clockOutCondition}.`);
    console.debug(`Current time: ${currentTime}.`);
    console.debug(`Is clocked in: ${isClockedIn}.`);
    console.debug(`Clock-in enabled: ${clockInEnabled}. Clock-in time: ${clockInTime}.`);
    console.debug(`Clock-out enabled: ${clockOutEnabled}. Clock-out time: ${clockOutTime}.`);
    console.debug("");

    if (clockInCondition) {
        try {
            await api.clockInOut();
            await sendNotification("Automatically clocked-in to Keka."); // todo Add translation
        } catch (error) {
            await sendNotification("Failed to automatically clock-in.", "error", error); // todo Add translation
        }
    } else if (clockOutCondition) {
        try {
            await api.clockInOut(true);
            await sendNotification("Automatically clocked-out of Keka."); // todo Add translation
        } catch (error) {
            await sendNotification("Failed to automatically clock-out.", "error", error); // todo Add translation
        }
    }
}

/**
 * Determines whether today is a weekday.
 *
 * @returns {boolean} True if the date is a weekday, false otherwise.
 */
function isWeekday() {
    return new Date().getDay() % 6 !== 0;
}

/**
 * Retrieves the current time in HH:MM format.
 *
 * @returns {string} Formatted time string.
 */
function getFormattedTime() {
    return new Date().toTimeString().slice(0, 5);
}

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
   if (notificationId === ALARM_NAME) {
       await (await KekaAPI.create()).clockInOut();
   }
});
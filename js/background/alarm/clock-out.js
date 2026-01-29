import {KekaAPI} from "../../api.js";

const ALARM_NAME = "clockOutReminder";
const EIGHT_HOURS_IN_SECONDS = 8 * 60 * 60;

chrome.runtime.onInstalled.addListener(async () => {
    const hasAlarm = await chrome.alarms.get(ALARM_NAME);

    if (!hasAlarm) {
        chrome.alarms.create(ALARM_NAME, {periodInMinutes: 15});
    }
})

chrome.alarms.onAlarm.addListener(async alarm => {
    if (alarm.name !== ALARM_NAME) {
        return;
    }

    const api = await KekaAPI.create();

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
});
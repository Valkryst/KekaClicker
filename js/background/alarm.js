import {KekaAPI} from "../api.js";
import {localize} from "../i18n.js";

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
    if (await api.isClockedIn()) {
        if ((await api.getTimeClocked()) >= EIGHT_HOURS_IN_SECONDS) {
            chrome.notifications.create(
                ALARM_NAME,
                {
                    buttons: [
                        {title: localize("__MSG_attendanceToggle__")}
                    ],
                    iconUrl: "/resources/favicon/512.png",
                    message: "You have been clocked-in for more than 8 hours. Consider clocking-out now.",
                    title: "Keka Clock-Out Reminder",
                    type: "basic"
                }
            );
        }
    }
});

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
   if (notificationId === ALARM_NAME) {
       await (await KekaAPI.create()).clockInOut();
   }
});
import {getStoredValue, setStoredValue, SUBDOMAIN_STORE_KEY, TOKEN_STORE_KEY} from "../element/input/_.js";
import {getToken} from "./utility.js";

export class KekaAPI {
    /** You should call the async {@link create()} method instead of calling this directly. */
    constructor() {}

    /**
     * Creates and initializes a new KekaAPI instance.
     *
     * @returns {Promise<KekaAPI>} Initialized instance.
     * @throws {Error} If there's an issue retrieving or validating the subdomain or token.
     */
    static async create() {
        const instance = new KekaAPI();
        await instance.#setSubdomain();
        await instance.#setToken();
        return instance;
    }

    /**
     * Attempts to send a clock-in/clock-out request to Keka's API.
     *
     * The requests are identical. You may want to check the current clock-in status before calling this method.
     *
     * @returns {Promise<boolean>} Whether the user is clocked in.
     */
    async clockInOut() {
       const response = await fetch(`${this.domain}/k/dashboard/api/mytime/attendance/webclockin`, {
           credentials: "include",
           body: JSON.stringify({
               timestamp: new Date().toISOString(),
               attendanceLogSource: 1,
               locationAddress: null,
               manualClockinType: 1,
               note: "",
               originalPunchStatus: 1
           }),
           method: "POST",
           headers: this.#getHeaders(),
       });

       if (!response.ok) {
          throw new Error(`Clock-in/out failed: ${response.statusText}`);
       }

       return await this.isClockedIn();
    }

    /**
     * Attempts to refresh the stored token by retrieving it from Keka.
     *
     * @returns {Promise<String>} The new token.
     * @throws {Error} If there is an issue retrieving or storing the token.
     */
    async refreshToken() {
        const token = await getToken();
        await setStoredValue(TOKEN_STORE_KEY, token);
        this.token = token;
        return token;
    }

    /**
     * Attempts to determine whether the user is currently clocked in.
     *
     * @returns {Promise<boolean>} True if clocked in, false otherwise.
     * @throws {Error} If there is an issue determining the clock-in status.
     */
    async isClockedIn() {
        const attendanceRecord = await this.getAttendanceRecord();

        // Get the most recent time entry for today.
        const mostRecentEntry = attendanceRecord.originalTimeEntries.sort((a, b) =>
            new Date(b.actualTimestamp) - new Date(a.actualTimestamp)
        )[0];

        return mostRecentEntry.punchStatus === 0;
    }

    /**
     * Attempts to determine whether the stored token is valid by making a test request to Keka's API.
     *
     * @returns {Promise<boolean>} Whether the token is valid.
     */
    async isTokenValid() {
        if (!this.token) {
            return false;
        }

        const response = await fetch(`${this.domain}/k/default/api/storyboard/attrition/user/hasaccess`, {
            credentials: "include",
            method: "GET",
            headers: this.#getHeaders()
        });

        return response.ok;
    }

    /**
     * Attempts to retrieve the attendance summary from Keka's API.
     *
     * @returns {Promise<Object>} Attendance summary data.
     * @throws {Error} If the request fails.
     */
    async getAttendanceSummary() {
        const response = await fetch(`${this.domain}/k/attendance/api/mytime/attendance/summary`, {
            credentials: "include",
            method: "GET",
            headers: this.#getHeaders()
        });

        if (!response.ok) {
            throw new Error(`Failed to retrieve attendance summary: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Attempts to retrieve the attendance record, for a specific date, from Keka's API.
     *
     * @param date {Date} Date for which to retrieve the attendance record. Defaults to today.
     * @returns {Promise<Object>} Attendance record for the specified date.
     * @throws {Error} If the request fails, or no record is found for the specified date.
     */
    async getAttendanceRecord(date = new Date()) {
        if (!date || !(date instanceof Date) || isNaN(date)) {
            throw new Error("Invalid date provided.");
        }

        const attendanceSummary = await this.getAttendanceSummary();
        if (attendanceSummary?.data?.length === 0) {
            throw new Error("Unable to retrieve attendance summary.");
        }

        const targetDate = date.toISOString().split("T")[0];
        const record = attendanceSummary.data.find(record => record?.attendanceDate.startsWith(targetDate));
        if (!record) {
            throw new Error(`No attendance record found for ${targetDate}.`);
        }

        return record;
    }

    /**
     * Attempts to retrieve the public profile from Keka's API.
     *
     * @returns {Promise<Object>} Public profile data.
     * @throws {Error} If the request fails.
     */
    async getPublicProfile() {
        const response = await fetch(`${this.domain}/k/default/api/me/publicprofile`, {
           credentials: "include",
           method: "GET",
           headers: this.#getHeaders()
        });

        if (!response.ok) {
            throw new Error(`Failed to retrieve public profile: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Retrieves the headers required for API requests.
     *
     * @returns {{accept: string, authorization: string, "content-type": string, origin: string, referer: string}}
     */
     #getHeaders() {
        return {
            "accept": "application/json, text/plain, */*",
            "authorization": `Bearer ${this.token}`,
            "content-type": "application/json; charset=UTF-8",
            "origin": this.domain,
            "referer": this.domain
        }
    }

    /**
     * Retrieves the stored subdomain and makes both it and the domain properties available.
     *
     * @returns {Promise<void>}
     * @throws {Error} See {@link getStoredValue} for possible errors.
     */
    async #setSubdomain() {
        const temp = await getStoredValue(SUBDOMAIN_STORE_KEY);
        if (!temp) {
            throw new Error("Subdomain must be set VIA the Options page.");
        }

        this.subdomain = temp;
        this.domain = `https://${this.subdomain}.keka.com`;
    }

    /**
     * Retrieves the stored token and makes it available as a property.
     *
     * @returns {Promise<void>}
     * @throws {Error} See {@link getStoredValue} for possible errors.
     */
    async #setToken() {
        this.token = await getStoredValue(TOKEN_STORE_KEY);
    }
}
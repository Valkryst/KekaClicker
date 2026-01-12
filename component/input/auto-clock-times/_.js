import { AUTO_CLOCK_IN_TIME_KEY, AUTO_CLOCK_OUT_TIME_KEY, AUTO_CLOCK_IN_ENABLED_KEY, AUTO_CLOCK_OUT_ENABLED_KEY, getStoredValue, setStoredValue } from "../../../js/storage.js";

const template = document.createElement('template');
template.innerHTML = `
    <div>
        <input type="checkbox" id="clock-in-enabled" />
        <label for="clock-in-enabled"></label>
        <input type="time" id="clock-in-time" />
    </div>
    <div>
        <input type="checkbox" id="clock-out-enabled" />
        <label for="clock-out-enabled"></label>
        <input type="time" id="clock-out-time" />
    </div>
`;

class AutoClockTimesElement extends HTMLElement {
    constructor() {
        super();
        this.append(template.content.cloneNode(true));

        const clockInEnabledLabel = this.#getClockInEnabledLabel();
        const clockOutEnabledLabel = this.#getClockOutEnabledLabel();
        clockInEnabledLabel.textContent = chrome.i18n.getMessage("optionsAutoClockInEnabledLabel");
        clockOutEnabledLabel.textContent = chrome.i18n.getMessage("optionsAutoClockOutEnabledLabel");

        const clockInEnabled = this.#getClockInEnabled();
        const clockOutEnabled = this.#getClockOutEnabled();
        const clockInInput = this.#getClockInInput();
        const clockOutInput = this.#getClockOutInput();

        const updateLabels = () => {
            const inTime = this.#format12h(clockInInput.value);
            const outTime = this.#format12h(clockOutInput.value);
            clockInEnabledLabel.textContent = chrome.i18n.getMessage("optionsAutoClockInEnabledLabel") + (inTime ? ` at ${inTime}.` : "");
            clockOutEnabledLabel.textContent = chrome.i18n.getMessage("optionsAutoClockOutEnabledLabel") + (outTime ? ` at ${outTime}.` : "");
        };

        clockInEnabled.addEventListener("change", () => this.#saveEnabled());
        clockOutEnabled.addEventListener("change", () => this.#saveEnabled());
        clockInInput.addEventListener("input", updateLabels);
        clockInInput.addEventListener("change", () => this.#save());
        clockOutInput.addEventListener("input", updateLabels);
        clockOutInput.addEventListener("change", () => this.#save());

        Promise.all([
            getStoredValue(AUTO_CLOCK_IN_ENABLED_KEY),
            getStoredValue(AUTO_CLOCK_OUT_ENABLED_KEY),
            getStoredValue(AUTO_CLOCK_IN_TIME_KEY),
            getStoredValue(AUTO_CLOCK_OUT_TIME_KEY)
        ]).then(async ([inEnabled, outEnabled, inTime, outTime]) => {
            clockInEnabled.checked = inEnabled;
            clockOutEnabled.checked = outEnabled;
            if (!inTime) {
                inTime = "09:00";
                await setStoredValue(AUTO_CLOCK_IN_TIME_KEY, inTime);
            }
            if (!outTime) {
                outTime = "17:00";
                await setStoredValue(AUTO_CLOCK_OUT_TIME_KEY, outTime);
            }
            clockInInput.value = inTime;
            clockOutInput.value = outTime;
            updateLabels();
        });
    }

    /** Saves the enabled states to storage. */
    async #saveEnabled() {
        try {
            await setStoredValue(AUTO_CLOCK_IN_ENABLED_KEY, this.#getClockInEnabled().checked);
            await setStoredValue(AUTO_CLOCK_OUT_ENABLED_KEY, this.#getClockOutEnabled().checked);
        } catch (error) {
            console.error("Failed to save auto clock enabled:", error);
        }
    }

    /** Saves the time values to storage. */
    async #save() {
        try {
            await setStoredValue(AUTO_CLOCK_IN_TIME_KEY, this.#getClockInValue());
            await setStoredValue(AUTO_CLOCK_OUT_TIME_KEY, this.#getClockOutValue());
        } catch (error) {
            console.error("Failed to save auto clock times:", error);
        }
    }

    /**
     * Retrieves the clock-in enabled checkbox element.
     *
     * @returns {HTMLInputElement} Clock-in enabled checkbox.
     */
    #getClockInEnabled() {
        return this.querySelector("#clock-in-enabled");
    }

    /**
     * Retrieves the clock-out enabled checkbox element.
     *
     * @returns {HTMLInputElement} Clock-out enabled checkbox.
     */
    #getClockOutEnabled() {
        return this.querySelector("#clock-out-enabled");
    }

    /**
     * Retrieves the clock-in enabled label element.
     *
     * @returns {HTMLLabelElement} Clock-in enabled label.
     */
    #getClockInEnabledLabel() {
        return this.querySelector("label[for='clock-in-enabled']");
    }

    /**
     * Retrieves the clock-out enabled label element.
     *
     * @returns {HTMLLabelElement} Clock-out enabled label.
     */
    #getClockOutEnabledLabel() {
        return this.querySelector("label[for='clock-out-enabled']");
    }

    /**
     * Retrieves the current value of the clock-in input.
     *
     * @returns {string} Current value of the clock-in input.
     */
    #getClockInValue() {
        return this.#getClockInInput().value;
    }

    /**
     * Retrieves the current value of the clock-out input.
     *
     * @returns {string} Current value of the clock-out input.
     */
    #getClockOutValue() {
        return this.#getClockOutInput().value;
    }

    /**
     * Retrieves the clock-in input element.
     *
     * @returns {HTMLInputElement} Clock-in input element.
     */
    #getClockInInput() {
        return this.querySelector("#clock-in-time");
    }

    /**
     * Retrieves the clock-out input element.
     *
     * @returns {HTMLInputElement} Clock-out input element.
     */
    #getClockOutInput() {
        return this.querySelector("#clock-out-time");
    }

    /**
     * Formats a 24h time string to 12h format.
     *
     * @param {string} time - Time in HH:MM format.
     * @returns {string} Time in 12h format, e.g., "9:00 AM".
     */
    #format12h(time) {
        if (!time) return "";
        const [hour, minute] = time.split(":");
        const h = parseInt(hour, 10);
        const ampm = h >= 12 ? "PM" : "AM";
        const displayHour = h % 12 || 12;
        return `${displayHour}:${minute} ${ampm}`;
    }
}

customElements.define("x-auto-clock-times", AutoClockTimesElement);
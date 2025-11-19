import {KekaAPI} from "../../../js/api.js";

const template = document.createElement('template');
template.innerHTML = `<span data-i18n="attendanceStatusLoading"></span>`;

/** Displays whether the user is currently clocked-in or clocked-out on Keka. */
class AttendanceStatusElement extends HTMLElement {
    /** Constructs a new {@link AttendanceStatusElement}. */
    constructor() {
        super();
        this.append(template.content.cloneNode(true));

        this.refreshIntervalId = null;

        this.#initialize();
    }

    /**
     * Invoked when the element is detached from the DOM.
     *
     * Clears the periodic refresh interval if one is active, to avoid unnecessary background work and potential memory
     * leaks while the element is no longer in use.
     */
    disconnectedCallback() {
        if (this.refreshIntervalId) {
            window.clearInterval(this.refreshIntervalId);
            this.refreshIntervalId = null;
        }
    }

    /**
     * Initializes the element after construction.
     *
     * @returns {Promise<void>} A promise which resolves when the element is initialized.
     */
    async #initialize() {
        this.#getElement().textContent = chrome.i18n.getMessage("attendanceStatusLoading");

        await this.updateDisplay();
        this.refreshIntervalId = window.setInterval(this.updateDisplay.bind(this), 1000 * 60);
    }

    /**
     * Updates the display to show the clocked status.
     *
     * If undefined is given as a parameter, then the latest status is fetched from Keka.
     *
     * @param {boolean} isClockedIn Whether
     * @returns {Promise<boolean|undefined>} Whether the user is clocked-in.
     */
    async updateDisplay(isClockedIn = undefined) {
        let api;
        try {
            api = await KekaAPI.create();
        } catch (error) {
            console.error(error);
            return undefined;
        }

        const element = this.#getElement();
        if (!element) {
            console.error("Status element not found.");
            return undefined;
        }

        if (!isClockedIn) {
            if (!api) {
                console.error("API not initialized.");
                return undefined;
            }

            element.textContent = chrome.i18n.getMessage("attendanceStatusLoading");
            element.style.color = "inherit";

            try {
                isClockedIn = await api.isClockedIn();
            } catch (error) {
                console.error(error);
                element.textContent = chrome.i18n.getMessage("attendanceStatusError");
                return undefined;
            }
        }

        if (isClockedIn) {
            element.textContent = chrome.i18n.getMessage("attendanceStatusClockedIn") + "!";
            element.style.color = "lime";
        } else {
            element.textContent = chrome.i18n.getMessage("attendanceStatusClockedOut");
            element.style.color = "red";
        }

        return isClockedIn;
    }

    /**
     * Retrieves the span element in which to display the clocked status.
     *
     * @returns {HTMLSpanElement} The span element.
     */
    #getElement() {
        return this.querySelector("span");
    }
}

customElements.define("x-attendance-status", AttendanceStatusElement);
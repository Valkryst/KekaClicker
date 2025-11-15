import {KekaAPI} from "../../js/api.js";

const template = document.createElement('template');
template.innerHTML = `<span>Loading...</span>`;

/** Displays the amount of time that the user has been clocked-in on Keka today. */
class ClockedTimeElement extends HTMLElement {
    /** Constructs a new {@link ClockedTimeElement}. */
    constructor() {
        super();
        this.append(template.content.cloneNode(true));

        this.api = null;
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
        try {
            this.api = await KekaAPI.create();
        } catch (error) {
            console.error(error);
        }

        await this.#updateDisplay();
        this.refreshIntervalId = window.setInterval(this.#updateDisplay.bind(this), 1000 * 60);
    }

    /**
     * Formats the total time spent clocked-in to Keka today as `#h #m`.
     *
     * @param {number} seconds Total time spent clocked-in, in seconds.
     * @return {string} Formatted time spent clocked-in.
     */
    #formatTime(seconds) {
        const totalMinutes = Math.floor(seconds / 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}h ${minutes}m`;
    }

    /** Fetches the latest clocked-in time from Keka and updates the display. */
    async #updateDisplay() {
        if (!this.api) {
            console.error("API not initialized.");
            return;
        }

        const element = this.#getElement();
        if (!element) {
            console.error("Time element not found.");
            return;
        }

        try {
            const secondsClocked = await this.api.getTimeClocked();
            element.textContent = this.#formatTime(secondsClocked);
        } catch (error) {
            console.error(error);
            element.textContent = "Error";
        }
    }

    /**
     * Retrieves the span element in which to display the time spent clocked-in.
     *
     * @returns {HTMLSpanElement} The span element.
     */
    #getElement() {
        return this.querySelector("span");
    }
}

customElements.define("x-clocked-time", ClockedTimeElement);
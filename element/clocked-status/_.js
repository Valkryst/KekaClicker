import {KekaAPI} from "../../js/api.js";

const template = document.createElement('template');
template.innerHTML = `<span>Loading...</span>`;

/** Displays whether the user is currently clocked-in or clocked-out on Keka. */
class ClockedStatusElement extends HTMLElement {
    /** Constructs a new {@link ClockedStatusElement}. */
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
     * Creates the backing API client, performs an initial render of the clocked status, and schedules periodic
     * refreshes.
     *
     * @returns {Promise<void>} A promise that resolves once the initial display update and interval registration are complete.
     */
    async #initialize() {
        try {
            this.api = await KekaAPI.create();
        } catch (error) {
            console.error(error);
        }

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
        const element = this.#getElement();
        if (!element) {
            console.error("Status element not found.");
            return undefined;
        }

        if (!isClockedIn) {
            if (!this.api) {
                console.error("API not initialized.");
                return undefined;
            }

            element.textContent = "Loading...";
            element.style.color = "inherit";

            try {
                isClockedIn = await this.api.isClockedIn();
            } catch (error) {
                console.error(error);
                element.textContent = "Error";
                return undefined;
            }
        }

        if (isClockedIn) {
            element.textContent = "Clocked-In";
            element.style.color = "lime";
        } else {
            element.textContent = "Clocked-Out";
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

customElements.define("x-clocked-status", ClockedStatusElement);
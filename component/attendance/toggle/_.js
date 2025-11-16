const template = document.createElement('template');
template.innerHTML = `<button></button>`;

/** Allows the user to clock-in or clock-out of Keka, depending on their current clocked status. */
class AttendanceToggleElement extends HTMLElement {
    /** Constructs a new {@link AttendanceToggleElement}. */
    constructor() {
        super();
        this.append(template.content.cloneNode(true));

        this.#getElement().textContent = chrome.i18n.getMessage("attendanceToggle");
    }

    /**
     * Retrieves the button element.
     *
     * @return {HTMLButtonElement} Clock-In/Out button.
     */
    #getElement() {
        return this.querySelector("button");
    }

    /**
     * Sets the button as either enabled or disabled.
     *
     * @param {boolean} enabled Whether the button should be enabled or disabled.
     */
    setEnabled(enabled) {
        if (enabled) {
            this.#getElement().removeAttribute("disabled");
        } else {
            this.#getElement().setAttribute("disabled", "true");
        }
    }
}

customElements.define("x-attendance-toggle", AttendanceToggleElement);
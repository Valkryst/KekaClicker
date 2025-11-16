import { SUBDOMAIN_STORE_KEY, getStoredValue, setStoredValue } from "../../../js/storage.js";

const template = document.createElement('template');
template.innerHTML = `
    <input type="text" pattern="^[A-Za-z0-9]+$" />
`;

class SubdomainInputElement extends HTMLElement {
    constructor() {
        super();
        this.append(template.content.cloneNode(true));

        const inputElement = this.#getInputElement();
        inputElement.addEventListener("input", () => this.#validateAndSave())
        getStoredValue(SUBDOMAIN_STORE_KEY).then(value => {
            inputElement.value = value ? value.trim() : "";
        });
    }

    /** Validates the input value, providing feedback to the user if required, and saves the value if it's valid. */
    #validateAndSave() {
        const inputElement = this.#getInputElement();
        inputElement.setCustomValidity("");

        if (inputElement.checkValidity()) {
            setStoredValue(SUBDOMAIN_STORE_KEY, this.#getInputValue());
        } else {
            inputElement.setCustomValidity(chrome.i18n.getMessage("optionsSubdomainInvalid"));
        }

        inputElement.reportValidity();
    }

    /**
     * Retrieves the input element.
     *
     * @returns {HTMLInputElement} Input element.
     */
    #getInputElement() {
        return this.querySelector("input");
    }

    /**
     * Retrieves the current value of the input element.
     *
     * @returns {string} Current value of the input element.
     */
    #getInputValue() {
        return this.#getInputElement().value.trim();
    }
}

customElements.define("x-subdomain-input", SubdomainInputElement);
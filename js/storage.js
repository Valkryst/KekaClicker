/**
 * Storage key for Keka's JWT token.
 * @type {string}
 */
export const TOKEN_STORE_KEY = "jwt";

/**
 * Storage key for the subdomain value.
 * @type {string}
 */
export const SUBDOMAIN_STORE_KEY = "subdomain";

/**
 * Default values for each store key.
 *
 * @type {{TOKEN_STORE_KEY: string, SUBDOMAIN_STORE_KEY: string}}
 */
const DEFAULT_STORE_VALUES = {
    [TOKEN_STORE_KEY]: "",
    [SUBDOMAIN_STORE_KEY]: ""
}

/**
 * Retrieves a saved value from Chrome's local storage.
 *
 * @param key {string} Key of the value to retrieve.
 * @returns {Promise<*>} Promise resolving to the stored value.
 * @throws {Error} If no key is provided.
 */
export async function getStoredValue(key) {
    if (!key) {
        throw new Error("A non-empty key must be provided in order to retrieve a stored value.");
    }

    const data = await chrome.storage.local.get(key) || {};
    return data[key] === undefined ? DEFAULT_STORE_VALUES[key] : data[key];
}

/**
 * Saves a value to Chrome's local storage.
 *
 * @param key {string} Key of the value to store.
 * @param value {*} Value to store.
 * @returns {Promise<void>} Promise that resolves when the value is stored.
 * @throws {Error} If no key is provided.
 */
export async function setStoredValue(key, value) {
    if (!key) {
        throw new Error("A non-empty key must be provided in order to store a value.");
    }

    await chrome.storage.local.set( { [key]: value } );
}
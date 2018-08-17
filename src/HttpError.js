/**
 * An error representing an HTTP Error during a network connection.
 * @private
 */
export default class HttpError extends Error {
    /**
     * @param {Number} status - The http eror code
     * @param {String} statusText - The string representation of the error
     * @param {String} url - The url that failed
     * @param {Object} headers - The headers whent he request failed
     * @param {*} response - The response the transation failed.  Determined arbitraility
     * by the server. Can be deserialized json.
     * @private
    */
    constructor(status, statusText, url, headers, response) {
        if (url) {
            super(`${statusText} <${url}>`);
        } else {
            super(`${statusText}`);
        }

        this.status = status;
        this.statusText = statusText;

        if (url) {
            this.url = url;
        }

        if (headers) {
            this.headers = headers;
        }

        if (response) {
            this.response = response;
        }
    }

    /**
     * Serializes to a readable string
     * @return {String} The error represented as a string
     * @private
     */
    toString() {
        return `HttpError: ${this.status} ${this.message}`;
    }
}

/**
 * @module @zakkudo/fetch/HttpError
 */

/**
 * An error representing an [HTTP error]{@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status} during a network connection.
 * @extends Error
 */
class HttpError extends Error {
    /**
     * @param {Integer} status - The [http error code]{@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status}
     * @param {String} statusText - The string representation of the error
     * @param {String} [url] - The url that failed
     * @param {Object} [headers] - The headers when the request failed
     * @param {*} [response] - The response of the transaction.  Determined arbitraility
     * by the server. Can be deserialized json.
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
     * @private
     */
    toString() {
        return `HttpError: ${this.status} ${this.message}`;
    }
}

export default HttpError;

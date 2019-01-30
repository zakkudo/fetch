/**
 * @module @zakkudo/fetch/HttpError
 */

/**
 * An error representing an
 * [HTTP error]{@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status}
 * during a network connection.
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

    /**
     * The [http error code]{@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status}
     */
    this.status = status;
    /**
     * The string representation of the error
     */
    this.statusText = statusText;

    if (url) {
      /**
       * The url that failed
       */
      this.url = url;
    }

    if (headers) {
      /**
       * The headers when the request failed
       */
      this.headers = headers;
    }

    if (response) {
      /**
       * The response of the transaction.  Determined arbitraility
       * by the server. Can be deserialized json.
       */
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

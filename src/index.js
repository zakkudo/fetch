/**
 * @module @zakkudo/fetch
 */

import HttpError from './HttpError';
import Immutable from 'immutable';
import Url from '@zakkudo/url';
import {fromJS} from 'immutable';

/**
 * @private
 */
function stringifyBody(options) {
    if (options.hasOwnProperty('body') && typeof options.body !== 'string') {
        options.body = JSON.stringify(options.body);
    }

    return options;
}

/**
 * @private
 */
function contentTypeIsApplicationJson(options) {
    const contentType = options.getIn(['headers', 'Content-Type']) || '';

    return contentType.startsWith('application/json');
}

/**
 * @private
 */
function toTransformRequestPromise(options) {
    let transformRequest = ensureImmutableList(options.get('transformRequest'));
    const blacklisted = new Set(['transformRequest', 'transformResponse', 'params']);

    transformRequest = transformRequest.push(stringifyBody);

    return transformRequest.reduce(
        (accumulator, fn) => accumulator.then((value) => fn(value)),
        Promise.resolve(options.filter((value, key) => !blacklisted.has(key)).toJS())
    ).then(fromJS);
}

/**
 * @private
 */
function ensureImmutableList(data) {
    if (!data) {
        return fromJS([]);
    } else if (data instanceof Immutable.List === false) {
        return fromJS([data]);
    }

    return data;
}

/**
 * @private
 */
function applyCustomOptions(url, options) {
    const _options = fromJS(options);

    return [
        new Url(url, (_options.get('params') || fromJS({})).toJS()),
        toTransformRequestPromise(_options),
        ensureImmutableList(_options.get('transformResponse')),
        ensureImmutableList(_options.get('transformError')),
    ];
}

/**
 * @private
 */
function throwHttpErrors(response) {
    return (payload) => {
        if (!response.ok) {
            const {status, statusText, headers, url} = response;

            throw new HttpError(status, statusText, url, headers, payload);
        }

        return payload;
    };
}

/**
 * Options modifying the network call, mostly analogous to fetch
 * @typedef {Object} module:@zakkudo/fetch~fetch~Options
 * @property {String} [options.method='GET'] - GET, POST, PUT, DELETE, etc.
 * @property {String} [options.mode='same-origin'] - no-cors, cors, same-origin
 * @property {String} [options.cache='default'] - default, no-cache, reload, force-cache, only-if-cached
 * @property {String} [options.credentials='omit'] - include, same-origin, omit
 * @property {String} options.headers - "application/json; charset=utf-8".
 * @property {String} [options.redirect='follow'] - manual, follow, error
 * @property {String} [options.referrer='client'] - no-referrer, client
 * @property {String|Object} [options.body] - `JSON.stringify` is automatically run for non-string types
 * @property {String|Object} [options.params] - Query params to be appended to
 * the url. The url must not already have params.  The serialization uses the
 * same rules as used by `@zakkudo/query-string`
 * @property {Function|Array<Function>} [options.transformRequest] - Transforms for the request body.
 * When not supplied, it by default json serializes the contents if not a simple string. Also accepts
 * promises as return values for asynchronous work.
 * @property {Function|Array<Function>} [options.transformResponse] - Transform the response.  Also accepts
 * promises as return values for asynchronous work.
 * @property {Function|Array<Function>} [options.transformError] - Transform the
 * error response. Return the error to keep the error state.  Return a non
 * `Error` to recover from the error in the promise chain.  A good place to place a login
 * handler when recieving a `401` from a backend endpoint or redirect to another page.
 * It's preferable to never throw an error here which will break the error transform chain in
 * a non-graceful way. Also accepts promises as return values for asynchronous work.
 */


/**
 * @name fetch
 * @kind function
 * @param {String} url - The request url
 * @param {module:@zakkudo/fetch~fetch~Options} [options] - Options modifying
 * the network call, mostly analogous to fetch
 * @return {Promise} Resolves to the response of the network transaction or rejects with an `HttpError`
 * @throws {module:@zakkudo/fetch/HttpError~HttpError} For errors during the network transaction
 * @throws {module:@zakkudo/fetch/UrlError~UrlError} For incorrectly formatted urls
 * @throws {module:@zakkudo/fetch/QueryStringError~QueryStringError} On issues
 * during serialization or construction of the query string
 */
function _fetch(url, options = {}) {
    return new Promise((resolve, reject) => {
        const [
            _url,
            transformRequestPromise,
            transformResponse,
            transformError,
        ] = applyCustomOptions(url, options);

        transformRequestPromise.then((transformedOptions) => {
            return fetch(String(_url), transformedOptions.toJS()).then((response) => {
                if (contentTypeIsApplicationJson(transformedOptions)) {
                    return response.json().catch((e) => {
                        if (response.ok) {
                            return {};
                        }

                        throw e;
                    }).then(throwHttpErrors(response));
                }

                return response.text().then(throwHttpErrors(response));
            }).then((response) => {
                return transformResponse.reduce(
                    (accumulator, fn) => accumulator.then((value) => {
                        return fn(value, String(_url), transformedOptions.toJS());
                    }),
                    Promise.resolve(response)
                ).then((response) => {
                    return response;
                });
            }).then(resolve).catch((reason) => {
                const transformed = transformError.reduce(
                    (accumulator, fn) => {
                        return accumulator.then((value) => {
                            if (value instanceof Error) {
                                return fn(value, String(_url), transformedOptions.toJS())
                            }

                            return value;
                        });
                    },
                    Promise.resolve(reason)
                );

                return transformed.then((response) => {
                    if (response instanceof Error) {
                        reject(response);
                    } else {
                        resolve(response);
                    }
                });
            }).catch((reason) => {
                reject(new Error(
                    `Tranform error threw an exception for ${_url} which will ` +
                    `break the transform chain. This can cause unexpected results.`,
                    reason
                ));
            });
        });
    });
}

export default _fetch;

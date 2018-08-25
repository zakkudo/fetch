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
 * Make using [fetch]{@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch} enjoyable.
 *
 * [![Build Status](https://travis-ci.org/zakkudo/fetch.svg?branch=master)](https://travis-ci.org/zakkudo/fetch)
 * [![Coverage Status](https://coveralls.io/repos/github/zakkudo/fetch/badge.svg?branch=master)](https://coveralls.io/github/zakkudo/fetch?branch=master)
 *
 * Why use this?
 *
 * - Consistancy with simplicity
 * - Automatically parses JSON payloads when the content type of the response is `application/json`
 * - Automatically serializes json in the request body
 * - Network errors throw an HttpError exception with the exception information for handling
 * - Interpolates params into url templates, ala `/users/:id/detail` with
 *   `{params: {id: "joe"}}` becomes `/users/joe/detail`
 * - Complex params are automatically JSON serialized similar to `@zakkudo/query-string`
 * - Proper `transformRequest`/`transformResponse` hooks
 *
 * Install with:
 *
 * ```console
 * yarn add @zakkudo/fetch
 * ```
 *
 * @param {String} url - The request url
 * @param {Object} options - Options modifying the network call, mostly analogous to fetch
 * @param {String} [options.method='GET'] - GET, POST, PUT, DELETE, etc.
 * @param {String} [options.mode='same-origin'] - no-cors, cors, same-origin
 * @param {String} [options.cache='default'] - default, no-cache, reload, force-cache, only-if-cached
 * @param {String} [options.credentials='omit'] - include, same-origin, omit
 * @param {String} options.headers - "application/json; charset=utf-8".
 * @param {String} [options.redirect='follow'] - manual, follow, error
 * @param {String} [options.referrer='client'] - no-referrer, client
 * @param {String|Object} [options.body] - `JSON.stringify` is automatically run for non-string types
 * @param {String|Object} [options.params] - Query params to be appended to
 * the url. The url must not already have params.  The serialization uses the
 * same rules as used by `@zakkudo/query-string`
 * @param {Function|Array<Function>} [options.transformRequest] - Transforms for the request body.
 * When not supplied, it by default json serializes the contents if not a simple string. Also accepts
 * promises as return values for asynchronous work.
 * @param {Function|Array<Function>} [options.transformResponse] - Transform the response.  Also accepts
 * promises as return values for asynchronous work.
 * @param {Function|Array<Function>} [options.transformError] - Transform the
 * error response. Return the error to keep the error state.  Return a non
 * `Error` to recover from the error in the promise chain.  A good place to place a login
 * handler when recieving a `401` from a backend endpoint or redirect to another page.
 * It's preferable to never throw an error here which will break the error transform chain in
 * a non-graceful way. Also accepts promises as return values for asynchronous work.
 * @return {Promise} A promise that resolves to the response
 *
 * @example <caption>Post to an endpoint using promises</caption>
 * import fetch from '@zakkudo/fetch';
 *
 * //Create a user
 * fetch('http://example.com/users', {
 *     method: 'POST'
 *     body: {
 *         first_name: 'joe',
 *         last_name: 'johnson',
 *     },
 * }).then((reponse) => {
 *     console.log(response); // {'id': '1234'}
 * }.catch((reason) => {
 *     if (reason.status === 401) {
 *         return authenticate();
 *     }
 *
 *     console.error(reason);
 *     throw reason;
 * });
 *
 * @example <caption>Get data from an endpoint</caption>
 * import fetch from '@zakkudo/fetch';
 *
 * //Fetch the created user
 * fetch('http://example.com/users/:id', {
 *     params: {
 *         id: '1234'
 *     },
 * }).then((reponse) => {
 *     console.log(response); // {id: '1234', first_name: 'joe', last_name: 'johnson'}
 * }.catch((reason) => {
 *     if (reason.status === 401) {
 *         return authenticate();
 *     }
 *
 *     console.error(reason);
 *     throw reason;
 * });
 *
 * @example <caption>Transform requests</caption>
 * import fetch from '@zakkudo/fetch';
 *
 * //Fetch the created user
 * fetch('http://example.com/users/:id', {
 *     transformRequest(options) {
 *         return encodeWithJWT(options);
 *     },
 *     transformResponse(response) {
 *         const {first_name, last_name} = response;
 *
 *         response.full_name = `${first_name} ${last_name}`;
 *
 *         return response;
 *     },
 *     transformError(reason) {
 *         if (reason.status === 401) {
 *             window.href = '/login';
 *         }
 *
 *         return reason;
 *     },
 *     params: {
 *         id: '1234'
 *     },
 * }).then((reponse) => {
 *     console.log(response); // {id: '1234', first_name: 'joe', last_name: 'johnson', full_name': 'joe johnson'}
 * });
 *
 * @example <caption>Handling errors</caption>
 * import fetch from '@zakkudo/fetch';
 * import HttpError from '@zakkudo/fetch/HttpError';
 *
 * fetch('http://example.com/does-not-exist').catch((reason) => {
 *     if (reason instanceof HttpError) {
 *         console.log(reason.status); // 404
 *     }
 * });
 *
 * @throws {UrlError} For incorrectly formatted urls
 * @throws {QueryStringError} On issues during serialization or construction of the query string
 * @module fetch
 */
export default function _fetch(url, options = {}) {
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

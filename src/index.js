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
function toFetchOptions(options) {
    let transformRequest = ensureImmutableList(options.get('transformRequest'));
    const blacklisted = new Set(['transformRequest', 'transformResponse', 'params']);

    transformRequest = transformRequest.push(stringifyBody);

    return fromJS(transformRequest.reduce(
        (accumulator, fn) => fn(accumulator),
        options.filter((value, key) => !blacklisted.has(key)).toJS()
    ));
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
        toFetchOptions(_options),
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
 * @property {String} [options.method='GET'] - GET, POST, PUT, DELETE, etc.
 * @property {String} [options.mode='same-origin'] - no-cors, cors, same-origin
 * @property {String} options.cache - default, no-cache, reload, force-cache, only-if-cached
 * @property {String} [options.credentials='omit'] - include, same-origin, omit
 * @property {String} options.headers - "application/json; charset=utf-8".
 * @property {String} [options.redirect='follow'] - manual, follow, error
 * @property {String} [options.referrer='client'] - no-referrer, client
 * @property {String|Object} options.body - `JSON.stringify` is automatically run for non-string types
 * @property {String} options.params - Query params to be appended to the url. The url must not already have params.
 * @property {Function|Array<Function>} options.transformRequest - Transforms for the request body.
 * When not supplied, it by default json serializes the contents if not a simple string.
 * @property {Function|Array<Function>} options.transformResponse - Transform the response.
 * @property {Function|Array<Function>} options.transformError - Transform the
 * error response. Return the error to keep the error state.  Return a non
 * `Error` to recover from the error in the promise chain.  A good place to place a login
 * handler when recieving a `401` from a backend endpoint or redirect to another page.
 * It's preferable to never throw an error here which will break the error transform chain in
 * a non-graceful way.
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
 *
 * @module fetch
 */
export default function _fetch(url, options = {}) {
    return new Promise((resolve, reject) => {
        const [
            _url,
            _options,
            transformResponse,
            transformError,
        ] = applyCustomOptions(url, options);

        fetch(String(_url), _options.toJS()).then((response) => {
            if (contentTypeIsApplicationJson(_options)) {
                return response.json().then(throwHttpErrors(response));
            }

            return response.text().then(throwHttpErrors(response));
        }).then((response) => {
            return transformResponse.reduce(
                (accumulator, fn) => fn(accumulator, String(_url), _options.toJS()),
                response
            );
        }).then(resolve).catch((reason) => {
            const transformed = transformError.reduce(
                (accumulator, fn) => {
                    if (accumulator instanceof Error) {
                        return fn(accumulator, String(_url), _options.toJS())
                    }

                    return accumulator;
                },
                reason
            );

            if (transformed instanceof Error) {
                reject(transformed);
            } else {
                resolve(transformed);
            }
        }).catch((reason) => {
            console.warn(
                `Tranform error threw an exception for ${_url} which will ` +
                `break the transform chain. This can cause unexpected results.`,
                reason
            );

            reject(reason);
        });
    });
}

import HttpError from './HttpError';
import Immutable from 'immutable';
import Url from '@zakkudo/url';
import {fromJS} from 'immutable';

/**
 * Fetch Options
 * @memberof Fetch
 * @typedef {Object} Options
 */

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

    if (!transformRequest.size) {
        transformRequest = transformRequest.unshift(stringifyBody);
    }

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
 * A convenience wrapper for native fetch.
 * @param {String} url - The prefered url
 * @param {Object} options - Options modifying the network call, mostly analogous to fetch
 * @property {String} [options.method='GET'] - GET, POST, PUT, DELETE, etc.
 * @property {String} [options.mode='same-origin'] - no-cors, cors, same-origin
 * @property {String} options.cache - default, no-cache, reload, force-cache, only-if-cached
 * @property {String} [options.credentials='omit'] - include, same-origin, omit
 * @property {String} options.headers - "application/json; charset=utf-8".
 * @property {String} [options.redirect='follow'] - manual, follow, error
 * @property {String} [options.referrer='client'] - no-referrer, client
 * @property {String|Object} options.body - JSON.stringify(data), // body data type must match "Content-Type" header
 * @property {String} options.params - Query params to be appended to the url. The url must not already have params.
 * @property {Function|Array<Function>} options.transformRequest - Transforms for the request body.
 * When not supplied, it by default json serializes the contents if not a simple string.
 * @property {Function|Array<Function>} options.transformResponse - Transform the response.
 * @return {Promise} A promise that resolves to the response
 * @module fetch
 */
export default function _fetch(url, options = {}) {
    return new Promise((resolve, reject) => {
         const [_url, _options, transformResponse] = applyCustomOptions(url, options);

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
        }).then(resolve).catch(reject);
    });
}

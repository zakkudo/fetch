# @zakkudo/fetch

Make using [native fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) enjoyable.

[![Build Status](https://travis-ci.org/zakkudo/fetch.svg?branch=master)](https://travis-ci.org/zakkudo/fetch)
[![Coverage Status](https://coveralls.io/repos/github/zakkudo/fetch/badge.svg?branch=master)](https://coveralls.io/github/zakkudo/fetch?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/zakkudo/fetch/badge.svg)](https://snyk.io/test/github/zakkudo/fetch)
[![Node](https://img.shields.io/node/v/@zakkudo/fetch.svg)](https://nodejs.org/)
[![License](https://img.shields.io/npm/l/@zakkudo/fetch.svg)](https://opensource.org/licenses/BSD-3-Clause)

## Why use this?

- Consistancy with simplicity
- Automatically parses JSON payloads when the content type of the response is `application/json`
- Automatically serializes json in the request body
- Network errors throw an HttpError exception with the exception information for handling
- Interpolates params into url templates. `/users/:id/detail` + `{params: {id: "joe"}}` = `/users/joe/detail`
- Complex params are automatically JSON serialized similar to `@zakkudo/query-string`
- Proper `transformRequest`/`transformResponse`/`transformError` hooks

## Install

``` console
# Install using npm
npm install @zakkudo/fetch
```

``` console
# Install using yarn
yarn add @zakkudo/fetch
```

## Examples

### Post to an endpoint
``` javascript
import fetch from '@zakkudo/fetch';

//Create a user
fetch('http://example.com/users', {
    method: 'POST'
    body: {
        first_name: 'joe',
        last_name: 'johnson',
    },
}).then((reponse) => {
    console.log(response); // {'id': '1234'}
}.catch((reason) => {
    if (reason.status === 401) {
        return authenticate();
    }

    console.error(reason);
    throw reason;
});
```

### Get data from an endpoint
``` javascript
import fetch from '@zakkudo/fetch';

//Fetch the created user
fetch('http://example.com/users/:id', {
    params: {
        id: '1234'
    },
}).then((reponse) => {
    console.log(response); // {id: '1234', first_name: 'joe', last_name: 'johnson'}
}.catch((reason) => {
    if (reason.status === 401) {
        return authenticate();
    }

    console.error(reason);
    throw reason;
});
```

### Transform everything everywhere
``` javascript
import fetch from '@zakkudo/fetch';

//Fetch the created user
fetch('http://example.com/users/:id', {
    transformRequest(options) {
        return encodeWithJWT(options);
    },
    transformResponse(response) {
        const {first_name, last_name} = response;

        response.full_name = `${first_name} ${last_name}`;

        return response;
    },
    transformError(reason) {
        if (reason.status === 401) {
            window.href = '/login';
        }

        return reason;
    },
    params: {
        id: '1234'
    },
}).then((reponse) => {
    console.log(response); // {id: '1234', first_name: 'joe', last_name: 'johnson', full_name': 'joe johnson'}
});
```

### Handling errors
``` javascript
import fetch from '@zakkudo/fetch';
import HttpError from '@zakkudo/fetch/HttpError';

fetch('http://example.com/does-not-exist').catch((reason) => {
    if (reason instanceof HttpError) {
        console.log(reason.status); // 404
    }
});
```

### Use with async/await
``` javascript
import fetch from '@zakkudo/fetch';
import HttpError from '@zakkudo/fetch/HttpError';

async function get() {
    try {
        const response = await fetch('http://example.com/does-not-exist');
        console.log(response);
    } catch (e) {
        if (e instanceof HttpError) {
            console.log(e.status); // 404
        }
    }
}
```

## API

<a name="module_@zakkudo/fetch"></a>

<a name="module_@zakkudo/fetch..fetch"></a>

### @zakkudo/fetch~fetch(url, options) ⇒ <code>Promise</code> ⏏

**Kind**: Exported function

**Returns**: <code>Promise</code> - Resolves to the response of the network transaction  
**Throws**:

- [<code>HttpError</code>](#module_@zakkudo/fetch/HttpError..HttpError) For errors during the network transaction
- [<code>UrlError</code>](#module_@zakkudo/fetch/UrlError..UrlError) For incorrectly formatted urls
- [<code>QueryStringError</code>](#module_@zakkudo/fetch/QueryStringError..QueryStringError) On issues during serialization or construction of the query string

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| url | <code>String</code> |  | The request url |
| options | <code>Object</code> |  | Options modifying the network call, mostly analogous to fetch |
| [options.method] | <code>String</code> | <code>&#x27;GET&#x27;</code> | GET, POST, PUT, DELETE, etc. |
| [options.mode] | <code>String</code> | <code>&#x27;same-origin&#x27;</code> | no-cors, cors, same-origin |
| [options.cache] | <code>String</code> | <code>&#x27;default&#x27;</code> | default, no-cache, reload, force-cache, only-if-cached |
| [options.credentials] | <code>String</code> | <code>&#x27;omit&#x27;</code> | include, same-origin, omit |
| options.headers | <code>String</code> |  | "application/json; charset=utf-8". |
| [options.redirect] | <code>String</code> | <code>&#x27;follow&#x27;</code> | manual, follow, error |
| [options.referrer] | <code>String</code> | <code>&#x27;client&#x27;</code> | no-referrer, client |
| [options.body] | <code>String</code> \| <code>Object</code> |  | `JSON.stringify` is automatically run for non-string types |
| [options.params] | <code>String</code> \| <code>Object</code> |  | Query params to be appended to the url. The url must not already have params.  The serialization uses the same rules as used by `@zakkudo/query-string` |
| [options.transformRequest] | <code>function</code> \| <code>Array.&lt;function()&gt;</code> |  | Transforms for the request body. When not supplied, it by default json serializes the contents if not a simple string. Also accepts promises as return values for asynchronous work. |
| [options.transformResponse] | <code>function</code> \| <code>Array.&lt;function()&gt;</code> |  | Transform the response.  Also accepts promises as return values for asynchronous work. |
| [options.transformError] | <code>function</code> \| <code>Array.&lt;function()&gt;</code> |  | Transform the error response. Return the error to keep the error state.  Return a non `Error` to recover from the error in the promise chain.  A good place to place a login handler when recieving a `401` from a backend endpoint or redirect to another page. It's preferable to never throw an error here which will break the error transform chain in a non-graceful way. Also accepts promises as return values for asynchronous work. |

<a name="module_@zakkudo/fetch/HttpError"></a>

<a name="module_@zakkudo/fetch/HttpError..HttpError"></a>

### @zakkudo/fetch/HttpError~HttpError ⇐ <code>Error</code> ⏏
An error representing an
[HTTP error](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
during a network connection.

**Kind**: Exported class

**Extends**: <code>Error</code>  

* [~HttpError](#module_@zakkudo/fetch/HttpError..HttpError) ⇐ <code>Error</code>
    * [new HttpError(status, statusText, [url], [headers], [response])](#new_module_@zakkudo/fetch/HttpError..HttpError_new)
    * [.status](#module_@zakkudo/fetch/HttpError..HttpError+status)
    * [.statusText](#module_@zakkudo/fetch/HttpError..HttpError+statusText)
    * [.url](#module_@zakkudo/fetch/HttpError..HttpError+url)
    * [.headers](#module_@zakkudo/fetch/HttpError..HttpError+headers)
    * [.response](#module_@zakkudo/fetch/HttpError..HttpError+response)

<a name="new_module_@zakkudo/fetch/HttpError..HttpError_new"></a>

#### new HttpError(status, statusText, [url], [headers], [response])

| Param | Type | Description |
| --- | --- | --- |
| status | <code>Integer</code> | The [http error code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) |
| statusText | <code>String</code> | The string representation of the error |
| [url] | <code>String</code> | The url that failed |
| [headers] | <code>Object</code> | The headers when the request failed |
| [response] | <code>\*</code> | The response of the transaction.  Determined arbitraility by the server. Can be deserialized json. |

<a name="module_@zakkudo/fetch/HttpError..HttpError+status"></a>

#### httpError.status
The [http error code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

**Kind**: instance property of [<code>HttpError</code>](#module_@zakkudo/fetch/HttpError..HttpError)  
<a name="module_@zakkudo/fetch/HttpError..HttpError+statusText"></a>

#### httpError.statusText
The string representation of the error

**Kind**: instance property of [<code>HttpError</code>](#module_@zakkudo/fetch/HttpError..HttpError)  
<a name="module_@zakkudo/fetch/HttpError..HttpError+url"></a>

#### httpError.url
The url that failed

**Kind**: instance property of [<code>HttpError</code>](#module_@zakkudo/fetch/HttpError..HttpError)  
<a name="module_@zakkudo/fetch/HttpError..HttpError+headers"></a>

#### httpError.headers
The headers when the request failed

**Kind**: instance property of [<code>HttpError</code>](#module_@zakkudo/fetch/HttpError..HttpError)  
<a name="module_@zakkudo/fetch/HttpError..HttpError+response"></a>

#### httpError.response
The response of the transaction.  Determined arbitraility
by the server. Can be deserialized json.

**Kind**: instance property of [<code>HttpError</code>](#module_@zakkudo/fetch/HttpError..HttpError)  
<a name="module_@zakkudo/fetch/UrlError"></a>

<a name="module_@zakkudo/fetch/UrlError..UrlError"></a>

### @zakkudo/fetch/UrlError~UrlError ⏏
Aliased error from package `@zakkudo/url/UrlError`

**Kind**: Exported class

<a name="module_@zakkudo/fetch/QueryStringError"></a>

<a name="module_@zakkudo/fetch/QueryStringError..QueryStringError"></a>

### @zakkudo/fetch/QueryStringError~QueryStringError ⏏
Aliased error from package `@zakkudo/url/QueryStringError`

**Kind**: Exported class


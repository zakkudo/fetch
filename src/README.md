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

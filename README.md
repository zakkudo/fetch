<a name="module_fetch"></a>

## fetch ⇒ <code>Promise</code>
Make using [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) enjoyable.

Why use this?

- Consistancy with simplicity
- Automatically parses JSON payloads when the content type of the response is `application/json`
- Automatically serializes json in the request body
- Network errors throw an HttpError exception with the exception information for handling
- Interpolates params into url templates, ala `/users/:id/detail` with
  `{params: {id: "joe"}}` becomes `/users/joe/detail`
- Complex params are automatically JSON serialized similar to `@zakkudo/query-string`
- Proper `transformRequest`/`transformResponse` hooks

Install with:

```console
yarn add @zakkudo/fetch
```

**Returns**: <code>Promise</code> - A promise that resolves to the response  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>String</code> | The request url |
| options | <code>Object</code> | Options modifying the network call, mostly analogous to fetch |

**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| [options.method] | <code>String</code> | <code>&#x27;GET&#x27;</code> | GET, POST, PUT, DELETE, etc. |
| [options.mode] | <code>String</code> | <code>&#x27;same-origin&#x27;</code> | no-cors, cors, same-origin |
| options.cache | <code>String</code> |  | default, no-cache, reload, force-cache, only-if-cached |
| [options.credentials] | <code>String</code> | <code>&#x27;omit&#x27;</code> | include, same-origin, omit |
| options.headers | <code>String</code> |  | "application/json; charset=utf-8". |
| [options.redirect] | <code>String</code> | <code>&#x27;follow&#x27;</code> | manual, follow, error |
| [options.referrer] | <code>String</code> | <code>&#x27;client&#x27;</code> | no-referrer, client |
| options.body | <code>String</code> \| <code>Object</code> |  | `JSON.stringify` is automatically run for non-string types |
| options.params | <code>String</code> |  | Query params to be appended to the url. The url must not already have params. |
| options.transformRequest | <code>function</code> \| <code>Array.&lt;function()&gt;</code> |  | Transforms for the request body. When not supplied, it by default json serializes the contents if not a simple string. |
| options.transformResponse | <code>function</code> \| <code>Array.&lt;function()&gt;</code> |  | Transform the response. |

**Example** *(Post to an endpoint using promises)*  
```js
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
**Example** *(Get data from an endpoint)*  
```js
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
**Example** *(Transform requests)*  
```js
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
    }
    params: {
        id: '1234'
    },
}).then((reponse) => {
    console.log(response); // {id: '1234', first_name: 'joe', last_name: 'johnson', full_name': 'joe johnson'}
});
```

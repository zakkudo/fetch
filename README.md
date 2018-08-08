## Modules

<dl>
<dt><a href="#module_HttpError">HttpError</a></dt>
<dd><p>An error representing an HTTP Error during a network connection.</p>
</dd>
<dt><a href="#module_lib/fetch">lib/fetch</a> ⇒ <code>Promise</code></dt>
<dd><p>A convenience wrapper for native fetch.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Fetch">Fetch</a></dt>
<dd><p>Fetch config</p>
</dd>
</dl>

<a name="module_HttpError"></a>

## HttpError
An error representing an HTTP Error during a network connection.


* [HttpError](#module_HttpError)
    * [module.exports](#exp_module_HttpError--module.exports) ⏏
        * [new module.exports(status, statusText, url, headers, response)](#new_module_HttpError--module.exports_new)
        * [.toString()](#module_HttpError--module.exports+toString) ⇒ <code>String</code>

<a name="exp_module_HttpError--module.exports"></a>

### module.exports ⏏
**Kind**: Exported class  
<a name="new_module_HttpError--module.exports_new"></a>

#### new module.exports(status, statusText, url, headers, response)

| Param | Type | Description |
| --- | --- | --- |
| status | <code>Number</code> | The http eror code |
| statusText | <code>String</code> | The string representation of the error |
| url | <code>String</code> | The url that failed |
| headers | <code>Object</code> | The headers whent he request failed |
| response | <code>\*</code> | The response the transation failed.  Determined arbitraility by the server. Can be deserialized json. |

<a name="module_HttpError--module.exports+toString"></a>

#### module.exports.toString() ⇒ <code>String</code>
Serializes to a readable string

**Kind**: instance method of [<code>module.exports</code>](#exp_module_HttpError--module.exports)  
**Returns**: <code>String</code> - The error represented as a string  
<a name="module_lib/fetch"></a>

## lib/fetch ⇒ <code>Promise</code>
A convenience wrapper for native fetch.

**Returns**: <code>Promise</code> - A promise that resolves to the response  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>String</code> | The prefered url |
| options | [<code>Options</code>](#Fetch.Options) | Options modifying the network call, mostly analogous to fetch |

<a name="Fetch"></a>

## Fetch
Fetch config

**Kind**: global typedef  
**See**: [https://developer.mozilla.org/docs/Web/API/Fetch_API](https://developer.mozilla.org/docs/Web/API/Fetch_API)  
<a name="Fetch.Options"></a>

### Fetch.Options : <code>Object</code>
Fetch Options

**Kind**: static typedef of [<code>Fetch</code>](#Fetch)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| options.method | <code>boolean</code> | *GET, POST, PUT, DELETE, etc. |
| options.mode | <code>boolean</code> | no-cors, cors, *same-origin |
| options.cache | <code>boolean</code> | default, no-cache, reload, force-cache, only-if-cached |
| options.credentials | <code>boolean</code> | include, same-origin, *omit |
| options.headers | <code>boolean</code> | "application/json; charset=utf-8". |
| options.redirect | <code>boolean</code> | manual, *follow, error |
| options.referrer | <code>boolean</code> | no-referrer, *client |
| options.body | <code>boolean</code> | JSON.stringify(data), // body data type must match "Content-Type" header |
| options.params | <code>boolean</code> | Query params to be appended to the url. The url must not already have params. |
| options.transformRequest | <code>boolean</code> | Transforms for the request body. When not supplied, it by default json serializes the contents if not a simple string. |
| options.transformResponse | <code>boolean</code> | Transform the response. |


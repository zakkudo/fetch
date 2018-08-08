<a name="module_fetch"></a>

## fetch ⇒ <code>Promise</code>
A convenience wrapper for native fetch.

**Returns**: <code>Promise</code> - A promise that resolves to the response  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>String</code> | The prefered url |
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
| options.body | <code>String</code> \| <code>Object</code> |  | JSON.stringify(data), // body data type must match "Content-Type" header |
| options.params | <code>String</code> |  | Query params to be appended to the url. The url must not already have params. |
| options.transformRequest | <code>function</code> \| <code>Array.&lt;function()&gt;</code> |  | Transforms for the request body. When not supplied, it by default json serializes the contents if not a simple string. |
| options.transformResponse | <code>function</code> \| <code>Array.&lt;function()&gt;</code> |  | Transform the response. |


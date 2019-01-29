import HttpError from './HttpError';
import MockTestHelper from './MockTestHelper';
import fetch from '.';

const mocks = {};

class NotReachableError extends Error {
    constructor() {
        super();
        this.message = 'This code should not be reachable';
    }
}

/**
 * @private
 */
class Helper extends MockTestHelper {
    /**
     * @private
     */
    static assert(response, asserts) {
        if (asserts.hasOwnProperty('calls')) {
            expect(global.fetch.mock.calls).toEqual(asserts.calls);
        }

        if (asserts.hasOwnProperty('response')) {
            expect(response).toEqual(asserts.response);
        }
    }
}

describe('lib/fetch', () => {
    beforeEach(() => {
        mocks.fetch = global.fetch = jest.fn()
        mocks.fetch.mockReturnValue(Promise.resolve({
            ok: true,
            json: () => Promise.resolve('test json response'),
            text: () => Promise.resolve('test text response'),
            headers: {
                get: () => 'plain/text'
            }
        }));

        mocks.formData = global.FormData = jest.fn();
    });

    afterEach(() => {
        Object.entries(mocks).forEach(([key, mock]) => {
            mock.mockRestore();
            delete mocks[key];
        });
    });

    it('returns response using text as fallback loader', () => {
        return fetch('test url').then((response) => {
            Helper.assert(response, {
                response: 'test text response',
                calls: [['test url', {}]],
            });
        });
    });

    it('passes in the fetch init', () => {
        return fetch('test url', {test: 'fetch init'}).then((response) => {
            Helper.assert(response, {
                response: 'test text response',
                calls: [['test url', {test: 'fetch init'}]],
            });
        });
    });

    it('returns response using text as fallback loader', () => {
        mocks.fetch.mockReturnValue(Promise.reject(new Error('test error')));

        return fetch('test url').then(() => {
            throw new NotReachableError();
        }).catch((reason) => {
            Helper.assert(reason, {
                response: new Error('test error'),
                calls: [['test url', {}]],
            });
        });
    });

    it(`parses the json when it's a json header`, () => {
        mocks.fetch.mockReturnValue(Promise.resolve({
            ok: true,
            json: () => Promise.resolve('test json response'),
            text: () => Promise.resolve('test text response'),
            headers: {
                get: () => 'application/json'
            }
        }));

        return fetch('test url', {
            headers: {
                'Content-Type': 'application/json',
            },
        }).then((response) => {
            Helper.assert(response, {
                response: 'test json response',
                calls: [['test url', {headers: {'Content-Type': 'application/json'}}]],
            });
        });
    });

    it(`returns null when json parse fails but is a json header and status ok`, () => {
        mocks.fetch.mockReturnValue(Promise.resolve({
            ok: true,
            json: () => Promise.reject(new TypeError('Fetch failed')),
            text: () => Promise.resolve('test text response'),
            headers: {
                get: () => 'application/json'
            }
        }));

        return fetch('test url', {
            headers: {
                'Content-Type': 'application/json',
            },
        }).then((response) => {
            Helper.assert(response, {
                response: null,
                calls: [['test url', {headers: {'Content-Type': 'application/json'}}]],
            });
        });
    });

    it(`rethrows error when json parse fails and is a json header and status is not ok`, () => {
        mocks.fetch.mockReturnValue(Promise.resolve({
            ok: false,
            json: () => Promise.reject(new TypeError('Fetch failed')),
            text: () => Promise.resolve('test text response'),
            headers: {
                get: () => 'application/json'
            }
        }));

        return fetch('test url', {
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(() => {
            throw new NotReachableError();
        }).catch((reason) => {
            expect(reason).toEqual(new TypeError('Fetch failed'));
        });
    });

    it(`parses the text when it's a text header`, () => {
        return fetch('test url', {
            headers: {
                'Content-Type': 'text/plain',
            },
        }).then((response) => {
            Helper.assert(response, {
                response: 'test text response',
                calls: [['test url', {headers: {'Content-Type': 'text/plain'}}]],
            });
        });
    });

    it(`serializes the body for plain/text`, () => {
        return fetch('test url', {
            headers: {
                'Content-Type': 'text/plain',
            },
            body: {
                test: 'value',
            },
        }).then((response) => {
            Helper.assert(response, {
                response: 'test text response',
                calls: [['test url', {
                    'headers': {
                        'Content-Type': 'text/plain',
                    },
                    'body': '{"test":"value"}',
                }]],
            });
        });
    });

    it(`serializes the body for application/json`, () => {
        mocks.fetch.mockReturnValue(Promise.resolve({
            ok: true,
            json: () => Promise.resolve('test json response'),
            text: () => Promise.resolve('test text response'),
            headers: {
                get: () => 'application/json'
            }
        }));

        return fetch('test url', {
            headers: {
                'Content-Type': 'application/json',
            },
            body: {
                test: 'value',
            },
        }).then((response) => {
            Helper.assert(response, {
                response: 'test json response',
                calls: [['test url', {
                    'headers': {
                        'Content-Type': 'application/json',
                    },
                    'body': '{"test":"value"}',
                }]],
            });
        });
    });

    describe('transformResponse', () => {
        it('transforms the response', () => {
            const transformResponse = jest.fn()
                .mockReturnValue('test transformed response');

            return fetch('test url', {
                transformResponse,
            }).then((response) => {
                expect(response).toEqual('test transformed response');
                expect(Helper.getCallArguments(transformResponse)).toEqual([[
                    'test text response',
                    'test url',
                    {},
                ]]);
            });
        });

        it('asynchronously transforms the response', () => {
            const transformResponse = jest.fn()
                .mockReturnValue(Promise.resolve('test transformed response'));

            return fetch('test url', {
                transformResponse,
            }).then((response) => {
                expect(response).toEqual('test transformed response');
                expect(Helper.getCallArguments(transformResponse)).toEqual([[
                    'test text response',
                    'test url',
                    {},
                ]]);
            });
        });

        it('chains the transforms to the response', () => {
            const firstTransformResponse = jest.fn()
                .mockReturnValue('test first transformed response');

            const secondTransformResponse = jest.fn()
                .mockReturnValue('test second transformed response');

            return fetch('test url', {
                transformResponse: [
                    firstTransformResponse,
                    secondTransformResponse,
                ],
            }).then((response) => {
                expect(response).toEqual('test second transformed response');
                expect(Helper.getCallArguments(firstTransformResponse)).toEqual([[
                    'test text response',
                    'test url',
                    {},
                ]]);

                expect(Helper.getCallArguments(secondTransformResponse)).toEqual([[
                    'test first transformed response',
                    'test url',
                    {},
                ]]);
            });
        });

        it('chains the asynchronous transforms to the response', () => {
            const firstTransformResponse = jest.fn()
                .mockReturnValue(Promise.resolve('test first transformed response'));

            const secondTransformResponse = jest.fn()
                .mockReturnValue('test second transformed response');

            return fetch('test url', {
                transformResponse: [
                    firstTransformResponse,
                    secondTransformResponse,
                ],
            }).then((response) => {
                expect(response).toEqual('test second transformed response');
                expect(Helper.getCallArguments(firstTransformResponse)).toEqual([[
                    'test text response',
                    'test url',
                    {},
                ]]);

                expect(Helper.getCallArguments(secondTransformResponse)).toEqual([[
                    'test first transformed response',
                    'test url',
                    {},
                ]]);
            });
        });
    });

    describe('transformRequest', () => {
        it('transforms the request', () => {
            const transformRequest = jest.fn()
                .mockReturnValue({test: 'test transformed request'});

            return fetch('test url', {
                transformRequest,
            }).then((response) => {
                expect(response).toEqual('test text response');
                expect(Helper.getCallArguments(mocks.fetch)).toEqual([[
                    'test url',
                    {'test': 'test transformed request'},
                ]]);
                expect(Helper.getCallArguments(transformRequest)).toEqual([[{
                }]]);
            });
        });

        it('transform does not modify the original request', () => {
            const transformRequest = jest.fn()
                .mockReturnValue({test: 'test transformed request'});
            const request = {
                test: 'untransformed request',
                transformRequest,
            };

            return fetch('test url', request).then((response) => {
                expect(response).toEqual('test text response');
                expect(Helper.getCallArguments(mocks.fetch)).toEqual([[
                    'test url',
                    {'test': 'test transformed request'},
                ]]);
                expect(Helper.getCallArguments(transformRequest)).toEqual([[{
                    test: 'untransformed request'
                }]]);

                expect(request).toEqual({
                    test: 'untransformed request',
                    transformRequest,
                });
            });
        });

        it('transforms the request params into a preserialized string', () => {
            const transformRequest = jest.fn()
                .mockReturnValue({params: 'testtransformedrequest=1,2,3'});

            return fetch('test url', {
                transformRequest,
            }).then((response) => {
                expect(response).toEqual('test text response');
                expect(Helper.getCallArguments(mocks.fetch)).toEqual([[
                    'test url?testtransformedrequest=1%2C2%2C3',
                    {}
                ]]);
                expect(Helper.getCallArguments(transformRequest)).toEqual([[{
                }]]);
            });
        });

        it('transforms the request params into a preserialized string with no escaping', () => {
            const transformRequest = jest.fn()
                .mockReturnValue({unsafe: true, params: 'testtransformedrequest=1,2,3'});

            return fetch('test url', {
                transformRequest
            }).then((response) => {
                expect(response).toEqual('test text response');
                expect(Helper.getCallArguments(mocks.fetch)).toEqual([[
                    'test url?testtransformedrequest=1,2,3',
                    {}
                ]]);
                expect(Helper.getCallArguments(transformRequest)).toEqual([[{
                }]]);
            });
        });

        it('uses the params with no escaping', () => {
            return fetch('test url', {
                params: {
                    testtransformedrequest: '1,2,3'
                },
                unsafe: true
            }).then((response) => {
                expect(response).toEqual('test text response');
                expect(Helper.getCallArguments(mocks.fetch)).toEqual([[
                    'test url?testtransformedrequest=1,2,3',
                    {}
                ]]);
            });
        });

        it('overwrites the params transforms the request params into a preserialized string', () => {
            const transformRequest = jest.fn()
                .mockReturnValue({params: 'test transformed request=2'});

            return fetch('test url', {
                'params': {'test request': 'test value'},
                transformRequest,
            }).then((response) => {
                expect(response).toEqual('test text response');
                expect(Helper.getCallArguments(mocks.fetch)).toEqual([[
                    'test url?test%20transformed%20request=2',
                    {},
                ]]);
                expect(Helper.getCallArguments(transformRequest)).toEqual([[{
                    params: {'test request': 'test value'}
                }]]);
            });
        });

        it('transforms the request asyncronously', () => {
            const transformRequest = jest.fn()
                .mockReturnValue(Promise.resolve({test: 'test transformed request'}));

            return fetch('test url', {
                transformRequest,
            }).then((response) => {
                expect(response).toEqual('test text response');
                expect(Helper.getCallArguments(mocks.fetch)).toEqual([[
                    'test url',
                    {'test': 'test transformed request'},
                ]]);
                expect(Helper.getCallArguments(transformRequest)).toEqual([[{
                }]]);
            });
        });

        it('chains the transforms to the request', () => {
            const firstTransformRequest = jest.fn()
                .mockReturnValue({test: 'test first transformed request'});

            const secondTransformRequest = jest.fn()
                .mockReturnValue({test: 'test second transformed request'});

            return fetch('test url', {
                transformRequest: [
                    firstTransformRequest,
                    secondTransformRequest,
                ],
            }).then((response) => {
                expect(response).toEqual('test text response');
                expect(Helper.getCallArguments(mocks.fetch)).toEqual([[
                    'test url',
                    {'test': 'test second transformed request'},
                ]]);

                expect(Helper.getCallArguments(firstTransformRequest)).toEqual([[
                    {},
                ]]);

                expect(Helper.getCallArguments(secondTransformRequest)).toEqual([[
                    {test: 'test first transformed request'},
                ]]);
            });
        });

        it('chains the asynchronous transforms to the request', () => {
            const firstTransformRequest = jest.fn()
                .mockReturnValue(Promise.resolve({test: 'test first transformed request'}));

            const secondTransformRequest = jest.fn()
                .mockReturnValue({test: 'test second transformed request'});

            return fetch('test url', {
                transformRequest: [
                    firstTransformRequest,
                    secondTransformRequest,
                ],
            }).then((response) => {
                expect(response).toEqual('test text response');
                expect(Helper.getCallArguments(mocks.fetch)).toEqual([[
                    'test url',
                    {'test': 'test second transformed request'},
                ]]);

                expect(Helper.getCallArguments(firstTransformRequest)).toEqual([[
                    {},
                ]]);

                expect(Helper.getCallArguments(secondTransformRequest)).toEqual([[
                    {test: 'test first transformed request'},
                ]]);
           });
        });
    });

    it('adds params to the url', () => {
        return fetch('test url', {
            params: {
                'test': 'param',
            },
        }).then(() => {
            expect(Helper.getCallArguments(mocks.fetch)).toEqual([[
                'test url?test=param',
                {},
            ]]);
        });
    });

    it('throws an exception when there are params but the base url already has params', () => {
        return fetch('test url?', {
            params: {
                'test': 'param',
            },
        }).then(() => {
            throw new NotReachableError();
        }).catch((reason) => {
            expect(String(reason)).toEqual(
                'UrlError: Trying to add duplicate query param when already exists <test url?>'
            );
        });
    });

    it('throws an exception when there is an http error', () => {
        mocks.fetch.mockReturnValue(Promise.resolve({
            ok: false,
            status: 'test status',
            statusText: 'test status text',
            url: 'test url',
            json: () => Promise.resolve('test json response'),
            text: () => Promise.resolve('test text response'),
            headers: {
                get: () => 'plain/text'
            }
        }));

        return fetch('test url').then(() => {
            throw new NotReachableError();
        }).catch((reason) => {
            expect(HttpError.prototype.toString.apply(reason)).toEqual(
                'HttpError: test status test status text <test url>'
            );

            expect(reason.response).toEqual('test text response');
        });
    });

    describe('transformError', () => {
        it('transforms the error into a different error', () => {
            const transformError = jest.fn()
                .mockReturnValue(new Error('test transformed error'));

            mocks.fetch.mockReturnValue(Promise.reject(new Error('test error')));

            return fetch('test url', {
                transformError,
            }).then(() => {
                throw new Error('Not reached');
            }).catch((reason) => {
                expect(reason).toEqual(new Error('test transformed error'));
                expect(mocks.fetch.mock.calls).toEqual([
                    ['test url', {}]
                ]);
            });
        });

        it('asynchronously transforms the error into a different error', () => {
            const transformError = jest.fn()
                .mockReturnValue(Promise.resolve(new Error('test transformed error')));

            mocks.fetch.mockReturnValue(Promise.reject(new Error('test error')));

            return fetch('test url', {
                transformError,
            }).then(() => {
                throw new Error('Not reached');
            }).catch((reason) => {
                expect(reason).toEqual(new Error('test transformed error'));
                expect(mocks.fetch.mock.calls).toEqual([
                    ['test url', {}]
                ]);
            });
        });

        it('transforms the error through multiple functions', () => {
            const transformError1 = jest.fn()
                .mockReturnValue(new Error('test transformed error'));

            const transformError2 = jest.fn()
                .mockReturnValue(new Error('test further transformed error'));

            mocks.fetch.mockReturnValue(Promise.reject(new Error('test error')));

            return fetch('test url', {
                transformError: [transformError1, transformError2],
            }).then(() => {
                throw new Error('Not reached');
            }).catch((reason) => {
                expect(reason).toEqual(new Error('test further transformed error'));
                expect(mocks.fetch.mock.calls).toEqual([
                    ['test url', {}]
                ]);
            });
        });

        it('asynchronously transforms the error through multiple functions', () => {
            const transformError1 = jest.fn()
                .mockReturnValue(Promise.resolve(new Error('test transformed error')));

            const transformError2 = jest.fn()
                .mockReturnValue(new Error('test further transformed error'));

            mocks.fetch.mockReturnValue(Promise.reject(new Error('test error')));

            return fetch('test url', {
                transformError: [transformError1, transformError2],
            }).then(() => {
                throw new Error('Not reached');
            }).catch((reason) => {
                expect(reason).toEqual(new Error('test further transformed error'));
                expect(mocks.fetch.mock.calls).toEqual([
                    ['test url', {}]
                ]);
            });
        });

        it('transforms the error into a non-error', () => {
            const transformError = jest.fn()
                .mockReturnValue('test caught error');

            mocks.fetch.mockReturnValue(Promise.reject(new Error('test error')));

            return fetch('test url', {
                transformError,
            }).then((response) => {
                expect(response).toEqual('test caught error');
                expect(mocks.fetch.mock.calls).toEqual([
                    ['test url', {}]
                ]);
            });
        });

        it('transforms the error into a non-error and further transforms are not called', () => {
            const transformError1 = jest.fn()
                .mockReturnValue('test caught error');

            const transformError2 = jest.fn()
                .mockReturnValue(new Error('further transformed error'));

            mocks.fetch.mockReturnValue(Promise.reject(new Error('test error')));

            return fetch('test url', {
                transformError: [
                    transformError1,
                    transformError2,
                ],
            }).then((response) => {
                expect(response).toEqual('test caught error');
                expect(mocks.fetch.mock.calls).toEqual([
                    ['test url', {}]
                ]);
            });
        });

        it('handles an exception in the transform function gracefully', () => {
            const transformError = () => {
                throw new Error('interupted!');
            };

            mocks.fetch.mockReturnValue(Promise.reject(new Error('test error')));

            return fetch('test url', {
                transformError,
            }).then(() => {
                throw new NotReachableError();
            }).catch((reason) => {
                expect(reason).toEqual(new Error(
                    'Tranform error threw an exception for test url which will ' +
                    'break the transform chain. This can cause unexpected ' +
                    'results.'));
                expect(mocks.fetch.mock.calls).toEqual([
                    ['test url', {}]
                ]);
            });
        });
    });

    it(`passes in X-AUTH-TOKEN and Authorization to fetch headers`, () => {
        return fetch('test url', {
            headers: {
                'X-AUTH-TOKEN': '1234',
                'Authorization': 'Basic 1234',
            },
        }).then((response) => {
            Helper.assert(response, {
                response: 'test text response',
                calls: [['test url', {
                    headers: {
                    'X-AUTH-TOKEN': '1234',
                    'Authorization': 'Basic 1234',
                }}]],
            });
        });
    });

    it(`passes through form data with no content type`, () => {
        const data = new FormData();

        mocks.fetch.mockReturnValue(Promise.resolve({
            ok: true,
            status: 'test status',
            statusText: 'test status text',
            url: 'test url',
            json: () => Promise.resolve('test json response'),
            text: () => Promise.resolve('test text response'),
            headers: {
                get: () => 'application/json'
            }
        }));

        return fetch('test url', {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            body: data
        }).then((response) => {
            Helper.assert(response, {
                response: 'test json response',
                calls: [['test url', {
                    headers: {
                    },
                    body: data
                }]],
            });
        });
    });

    it(`json serializes form data when no content type`, () => {
        const data = new FormData();

        mocks.fetch.mockReturnValue(Promise.resolve({
            ok: true,
            status: 'test status',
            statusText: 'test status text',
            url: 'test url',
            json: () => Promise.resolve('test json response'),
            text: () => Promise.resolve('test text response'),
            headers: {
                get: () => 'application/json'
            }
        }));

        return fetch('test url', {
            body: data
        }).then((response) => {
            Helper.assert(response, {
                response: 'test json response',
                calls: [['test url', {
                    body: '{}'
                }]],
            });
        });
    });

    it(`falls back to text when response has no content type`, () => {
        mocks.fetch.mockReturnValue(Promise.resolve({
            ok: true,
            status: 'test status',
            statusText: 'test status text',
            url: 'test url',
            json: () => Promise.resolve('test json response'),
            text: () => Promise.resolve('test text response'),
            headers: {
                get: () => ''
            }
        }));

        return fetch('test url', {
        }).then((response) => {
            Helper.assert(response, {
                response: 'test text response',
                calls: [['test url', {}]],
            });
        });
    });
});


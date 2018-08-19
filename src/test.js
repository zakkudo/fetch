import HttpError from './HttpError';
import MockTestHelper from './MockTestHelper';
import fetch from '.';
import {fromJS} from 'immutable';

let fetchMock;

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
            expect(global.fetch.mock.calls.map((c) => fromJS(c).toJS())).toEqual(asserts.calls);
        }

        if (asserts.hasOwnProperty('response')) {
            expect(response).toEqual(asserts.response);
        }
    }
}

describe('lib/fetch', () => {
    beforeEach(() => {
        fetchMock = global.fetch = jest.fn()
        fetchMock.mockReturnValue(Promise.resolve({
            ok: true,
            json: () => Promise.resolve('test json response'),
            text: () => Promise.resolve('test text response'),
        }));
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
        fetchMock.mockReturnValue(Promise.reject(new Error('test error')));

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

    it('transforms the request', () => {
        const transformRequest = jest.fn()
            .mockReturnValue({test: 'test transformed request'});

        return fetch('test url', {
            transformRequest,
        }).then((request) => {
            expect(request).toEqual('test text response');
            expect(Helper.getCallArguments(fetchMock)).toEqual([[
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
        }).then((request) => {
            expect(request).toEqual('test text response');
            expect(Helper.getCallArguments(fetchMock)).toEqual([[
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

    it('adds params to the url', () => {
        return fetch('test url', {
            params: {
                'test': 'param',
            },
        }).then(() => {
            expect(Helper.getCallArguments(fetchMock)).toEqual([[
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

    it('throws an exception when ther is an http error', () => {
        fetchMock.mockReturnValue(Promise.resolve({
            ok: false,
            status: 'test status',
            statusText: 'test status text',
            url: 'test url',
            json: () => Promise.resolve('test json response'),
            text: () => Promise.resolve('test text response'),
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

    it('transforms the error into a different error', () => {
        const transformError = jest.fn()
            .mockReturnValue(new Error('test transformed error'));

        fetchMock.mockReturnValue(Promise.reject(new Error('test error')));

        return fetch('test url', {
            transformError,
        }).then(() => {
            throw new Error('Not reached');
        }).catch((reason) => {
            expect(reason).toEqual(new Error('test transformed error'));
            expect(fetchMock.mock.calls).toEqual([
                ['test url', {'transformError': transformError}]
            ]);
        });
    });

    it('transforms the error through multiple functions', () => {
        const transformError1 = jest.fn()
            .mockReturnValue(new Error('test transformed error'));

        const transformError2 = jest.fn()
            .mockReturnValue(new Error('test further transformed error'));

        fetchMock.mockReturnValue(Promise.reject(new Error('test error')));

        return fetch('test url', {
            transformError: [transformError1, transformError2],
        }).then(() => {
            throw new Error('Not reached');
        }).catch((reason) => {
            expect(reason).toEqual(new Error('test further transformed error'));
            expect(fetchMock.mock.calls).toEqual([
                ['test url', {'transformError': [
                    transformError1,
                    transformError2
                ]}]
            ]);
        });
    });

    it('transforms the error into a non-error', () => {
        const transformError = jest.fn()
            .mockReturnValue('test caught error');

        fetchMock.mockReturnValue(Promise.reject(new Error('test error')));

        return fetch('test url', {
            transformError,
        }).then((response) => {
            expect(response).toEqual('test caught error');
            expect(fetchMock.mock.calls).toEqual([
                ['test url', {'transformError': transformError}]
            ]);
        });
    });

    it('transforms the error into a non-error and further transforms are not called', () => {
        const transformError1 = jest.fn()
            .mockReturnValue('test caught error');

        const transformError2 = jest.fn()
            .mockReturnValue(new Error('further transformed error'));

        fetchMock.mockReturnValue(Promise.reject(new Error('test error')));

        return fetch('test url', {
            transformError: [
                transformError1,
                transformError2,
            ],
        }).then((response) => {
            expect(response).toEqual('test caught error');
            expect(fetchMock.mock.calls).toEqual([
                ['test url', {'transformError': [
                    transformError1,
                    transformError2,
                ]}]
            ]);
        });
    });

    it('handles an exception in the transform function gracefully', () => {
        const transformError = () => {
            throw new Error('interupted!');
        };

        fetchMock.mockReturnValue(Promise.reject(new Error('test error')));

        return fetch('test url', {
            transformError,
        }).then(() => {
            throw new NotReachableError();
        }).catch((reason) => {
            expect(reason).toEqual(new Error('interupted!'));
            expect(fetchMock.mock.calls).toEqual([
                ['test url', {'transformError': transformError}]
            ]);
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
});

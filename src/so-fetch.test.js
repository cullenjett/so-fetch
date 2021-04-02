const { Response, Headers } = require('node-fetch');

const { createClient } = require('./so-fetch');

const createFetchMock = ({
  response = {},
  status = 200,
  url = 'http://localhost:3000',
  responseOverride,
} = {}) => {
  return jest.fn().mockResolvedValue(
    responseOverride ||
      new Response(JSON.stringify(response), {
        status,
        headers: {
          'Content-Type': 'application/json',
        },
        url,
      })
  );
};

const setup = (options = {}) => {
  const fetch = options.fetch || createFetchMock();
  const http = createClient({
    baseUrl: 'http://localhost:3000',
    requestTransformers: [],
    errorListeners: [],
    ...options,
    fetch,
  });

  return {
    http,
    fetch,
  };
};

describe('http', () => {
  it('appends the given path to the baseUrl', async () => {
    const { http, fetch } = setup();

    await http.get('/api');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api',
      expect.any(Object)
    );
  });

  it('transforms the request', async () => {
    const getToken = jest.fn().mockResolvedValue('abc');

    const { http, fetch } = setup({
      requestTransformers: [
        (request) => {
          return {
            ...request,
            url: 'http://localhost:1234/foo',
          };
        },
        async (request) => {
          const token = await getToken();
          return {
            ...request,
            headers: {
              ...request.headers,
              authorization: `bearer ${token}`,
            },
          };
        },
      ],
    });

    await http.get('/api', { headers: { myHeader: 'myHeaderValue' } });

    expect(getToken).toHaveBeenCalled();

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:1234/foo',
      expect.objectContaining({
        headers: {
          authorization: 'bearer abc',
          myHeader: 'myHeaderValue',
        },
      })
    );
  });

  it('throws on non-200 responses', () => {
    const errorResponse = { errors: { email: ['required'] } };
    const { http } = setup({
      fetch: createFetchMock({
        response: errorResponse,
        status: 400,
        url: 'http://localhost:3000/foo',
      }),
    });

    expect.assertions(1);
    return expect(http.get('/foo')).rejects.toEqual({
      data: errorResponse,
      headers: expect.any(Headers),
      request: {
        headers: {},
        method: 'GET',
        url: 'http://localhost:3000/foo',
      },
      status: 400,
      url: 'http://localhost:3000/foo',
    });
  });

  it('does not blow up for empty 204 responses', async () => {
    const { http } = setup({
      fetch: createFetchMock({
        response: undefined,
        status: 204,
      }),
    });

    expect.assertions(1);
    const res = await http.get('/foo');

    expect(res).toEqual({
      data: {},
      headers: expect.any(Headers),
      request: expect.any(Object),
      status: 204,
      url: expect.any(String),
    });
  });

  it('calls error listeners', async () => {
    const listener = jest.fn();
    const { http } = setup({
      fetch: jest.fn().mockResolvedValue(
        new Response(JSON.stringify('server error'), {
          status: 500,
          url: 'http://localhost:3000',
        })
      ),
      errorListeners: [listener],
    });

    expect.assertions(2);
    await expect(http.get('/foo')).rejects.toEqual({
      data: 'server error',
      status: 500,
      headers: expect.any(Headers),
      request: expect.any(Object),
      url: expect.any(String),
    });

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 500,
      })
    );
  });

  it('handles network errors', async () => {
    const error = new Error('failed to fetch');
    const { http } = setup({
      fetch: jest.fn().mockRejectedValue(error),
    });

    expect.assertions(1);
    return expect(http.get('/foo')).rejects.toEqual(error);
  });

  it('can send json in the request', async () => {
    const { http, fetch } = setup();
    const payload = { email: 'test@example.com' };

    await http.post('/api', payload);

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );
  });

  it('can send custom payloads', async () => {
    const { http, fetch } = setup();
    const payload = new URLSearchParams();
    payload.append('username', 'test@example.com');

    await http.post('/api', null, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload,
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api',
      expect.objectContaining({
        method: 'POST',
        body: payload,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    );
  });
});

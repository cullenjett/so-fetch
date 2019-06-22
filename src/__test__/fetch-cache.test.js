const { Headers, Response } = require('node-fetch');

const { createClient } = require('../fetch-cache');

global.Headers = Headers;
global.Response = Response;

const fetch = jest.fn(() => {
  return Promise.resolve(
    new Response('{}', {
      status: 200,
    })
  );
});

const defaultOptions = {
  baseUrl: 'http://localhost:3000',
  getAuthToken: jest.fn(() => 'AUTH_TOKEN'),
  fetch,
};

const setup = (options) => {
  return createClient({
    ...defaultOptions,
    ...options,
  });
};

describe('createClient', () => {
  describe('.get()', () => {
    it('calls options.fetch', async () => {
      const { get } = setup();
      await get('/api');
      expect(fetch).toHaveBeenCalled();
    });

    it('appends the given path to the baseUrl', async () => {
      const { get } = setup({
        baseUrl: 'http://localhost:3000',
      });

      await get('/api');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api',
        expect.any(Object)
      );
    });

    it('pulls an auth token and appends it as the "Authorization" header', async () => {
      const { get } = setup();

      await get('/api');

      expect(fetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'GET',
        headers: {
          Authorization: 'Bearer AUTH_TOKEN',
        },
      });
    });

    it('treats all non-2xx response statuses as errors', () => {
      const errorRes = {
        message: 'Unauthorized',
        statusCode: 'ACCESS_DENIED',
      };

      fetch.mockImplementationOnce(() => {
        return Promise.resolve(
          new Response(JSON.stringify(errorRes), {
            status: 404,
          })
        );
      });

      const { get } = setup();

      expect(get('/api')).rejects.toThrow(errorRes);
    });
  });
});

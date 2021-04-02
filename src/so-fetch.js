function createClient({
  baseUrl,
  fetch = window.fetch,
  requestTransformers = [],
  errorListeners = [],
}) {
  const sendRequest = async (url, method, config = {}, payload) => {
    const response = {};
    let request = {
      url,
      method,
      headers: {
        ...config.headers,
      },
    };

    if (config && config.body) {
      request.body = config.body;
    } else if (payload) {
      request.body = JSON.stringify(payload);
      request.headers['Content-Type'] = 'application/json';
    }

    request = await requestTransformers.reduce((promises, fn) => {
      return promises.then((req) => fn(req));
    }, Promise.resolve(request));

    response.request = request;

    const res = await fetch(response.request.url, response.request);

    response.status = res.status;
    response.headers = res.headers;
    response.url = res.url;

    const data = await res.text();
    if (data) {
      response.data = data; // in case JSON.parse blows up we'll still have the response text
      response.data = JSON.parse(data);
    }

    if (!res.ok) {
      throw response;
    } else {
      return response;
    }
  };

  const requestWithErrorListener = async (url, method, config, payload) => {
    try {
      return await sendRequest(url, method, config, payload);
    } catch (errorResponse) {
      errorListeners.forEach((fn) => fn(errorResponse));
      throw errorResponse;
    }
  };

  return {
    requestTransformers,

    errorListeners,

    get(path, config) {
      return requestWithErrorListener(`${baseUrl}${path}`, 'GET', config);
    },

    post(path, body, config) {
      return requestWithErrorListener(
        `${baseUrl}${path}`,
        'POST',
        config,
        body
      );
    },

    put(path, body, config) {
      return requestWithErrorListener(`${baseUrl}${path}`, 'PUT', config, body);
    },

    patch(path, body, config) {
      return requestWithErrorListener(
        `${baseUrl}${path}`,
        'PATCH',
        config,
        body
      );
    },

    delete(path, config) {
      return requestWithErrorListener(`${baseUrl}${path}`, 'DELETE', config);
    },
  };
}

module.exports = {
  createClient,
};

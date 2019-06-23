function createClient(options) {
  const { baseUrl, fetch, getAuthToken } = options;
  const authToken = getAuthToken();

  const get = (path) => {
    return fetch(baseUrl + path, {
      method: 'GET',
      headers: buildHeaders(authToken),
    }).then(handleResponse);
  };

  const post = (path, body) => {
    return fetch(baseUrl + path, {
      method: 'POST',
      headers: buildHeaders(authToken),
      body,
    }).then(handleResponse);
  };

  return {
    get,
    post,
  };
}

function buildHeaders(authToken) {
  const headers = {};

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return new Headers(headers);
}

function handleResponse(res) {
  if (!res.ok) {
    return res.json().then((r) => Promise.reject(r));
  }

  return res.json();
}

module.exports = {
  createClient,
};

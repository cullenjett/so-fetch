function createClient(options) {
  const { baseUrl, fetch, getAuthToken } = options;

  function get(path) {
    const authToken = getAuthToken();

    return fetch(baseUrl + path, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }).then((res) => {
      if (!res.ok) {
        throw new Error();
      }

      return res.json();
    });
  }

  return {
    get,
  };
}

module.exports = {
  createClient,
};

# So Fetch

<img src="./so-fetch.gif" width="400" />

A simple wrapper around the `fetch` API.

## What is it?

This is a placeholder repo for a pattern I find myself recreating every time I start a new application.

Nearly every client-side app needs to make HTTP requests, but using `fetch` directly isn't seamless -- you have to turn the `Response` object into something useful, and response codes > 2xx don't throw. Plus you will almost always benefit from having a centralized place to make HTTP requests so it's easier to add logging, custom request headers, etc.

## How to use it

The `createClient()` factory function returns an object with the HTTP verbs as methods (`.get()`, `.post()`, etc.). That returned object can then be used as the HTTP layer to interact with any given data source.

Typically I'll pass the HTTP client object to another module used for making API calls.

## Example

```javascript
// src/api/http.js

export const http = createClient({
  baseURL:
    process.env.NODE_ENV === 'production'
      ? 'http://www.my-api.com'
      : 'http://dev.my-api.com',
  fetch: window.fetch,
  getAuthToken: () => window.localStorage.getItem('authToken'),
});
```

```javascript
// src/api/plant-api.js

import { http } from './http';

const plantApiFactory = (http) => {
  return {
    all: () => http.get('/plants'),
    find: (id) => http.get(`/plants/${id}`),
    create: (plant) =>
      http.post('/plants', {
        plant,
      }),
  };
};

export const plantApi = plantApiFactory(http);
```

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const app = require('../../backend/app');
const http = require('http');

const server = http.createServer(app);
let port = 0;
const ready = new Promise((resolve) => {
  server.listen(0, '127.0.0.1', () => {
    port = server.address().port;
    resolve();
  });
});

export default async (request, context) => {
  await ready;

  const url = new URL(request.url);
  const headers = {};
  request.headers.forEach((v, k) => { headers[k] = v; });
  delete headers.host;

  const fetchUrl = `http://127.0.0.1:${port}${url.pathname}${url.search}`;

  const init = {
    method: request.method,
    headers,
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text();
  }

  const resp = await fetch(fetchUrl, init);

  const respHeaders = {};
  resp.headers.forEach((v, k) => { respHeaders[k] = v; });
  delete respHeaders['transfer-encoding'];

  return new Response(resp.body, {
    status: resp.status,
    headers: respHeaders,
  });
};

export const config = { path: "/api/*" };

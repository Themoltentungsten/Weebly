const http = require('http');
const app = require('../../backend/app');

const server = http.createServer(app);
let serverReady = false;
server.listen(0, () => { serverReady = true; });

function forwardRequest(event) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    if (!addr) {
      resolve({ statusCode: 503, body: 'Server not ready' });
      return;
    }

    const headers = { ...(event.headers || {}) };
    delete headers.host;
    delete headers['content-length'];

    const body = event.body || '';
    if (body) {
      headers['content-length'] = Buffer.byteLength(
        event.isBase64Encoded ? Buffer.from(body, 'base64') : body
      );
    }

    const options = {
      hostname: '127.0.0.1',
      port: addr.port,
      path: event.path + (event.rawQuery ? '?' + event.rawQuery : ''),
      method: event.httpMethod,
      headers,
    };

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const respHeaders = {};
        for (const [k, v] of Object.entries(res.headers)) {
          respHeaders[k] = Array.isArray(v) ? v.join(', ') : v;
        }
        resolve({
          statusCode: res.statusCode,
          headers: respHeaders,
          body: Buffer.concat(chunks).toString('utf-8'),
        });
      });
    });

    req.on('error', (err) => {
      resolve({ statusCode: 502, body: JSON.stringify({ error: err.message }) });
    });

    if (body) {
      req.write(event.isBase64Encoded ? Buffer.from(body, 'base64') : body);
    }
    req.end();
  });
}

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (!serverReady) {
    await new Promise((r) => setTimeout(r, 100));
  }

  return forwardRequest(event);
};

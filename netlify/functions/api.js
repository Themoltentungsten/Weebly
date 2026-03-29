const serverlessExpress = require('@vendia/serverless-express');
const app = require('../../backend/app');

const handler = serverlessExpress({ app });

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (!event.requestContext) {
    event.requestContext = {
      stage: '',
      resourcePath: event.path,
      httpMethod: event.httpMethod,
      identity: { sourceIp: (event.headers || {})['x-forwarded-for'] || '' },
    };
  }

  if (!event.multiValueHeaders) {
    event.multiValueHeaders = {};
    for (const [k, v] of Object.entries(event.headers || {})) {
      event.multiValueHeaders[k] = [v];
    }
  }

  if (!event.multiValueQueryStringParameters) {
    event.multiValueQueryStringParameters = {};
    for (const [k, v] of Object.entries(event.queryStringParameters || {})) {
      event.multiValueQueryStringParameters[k] = Array.isArray(v) ? v : [v];
    }
  }

  return handler(event, context);
};

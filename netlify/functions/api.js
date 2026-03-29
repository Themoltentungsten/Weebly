const serverless = require('serverless-http');
const app = require('../../backend/app');

const handler = serverless(app);

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  return handler(event, context);
};

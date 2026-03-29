const serverlessExpress = require('@vendia/serverless-express');
const app = require('../../backend/app');

const handler = serverlessExpress({ app });

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  return handler(event, context);
};

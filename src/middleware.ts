import { init } from '@fixify/agent';
import { defineMiddleware } from 'astro:middleware';

let agentStarted = false;

export const onRequest = defineMiddleware(async (_context, next) => {
  if (!agentStarted) {
    init({
      apiKey: 'proj_ed4895dea9c34c03b8e984e1ce8c1d14',
      serverUrl: 'https://fixifyserver-production.up.railway.app',
      collectInterval: 5000,
    });
    agentStarted = true;
  }
  return next();
});

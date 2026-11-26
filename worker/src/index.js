// Cloudflare Worker 的入口。做的事都在 letter.js
import { handle } from './letter.js';

export default {
  fetch: (request, env) => handle(request, env, { fetch: (...a) => fetch(...a), now: () => Date.now(), random: Math.random }),
};

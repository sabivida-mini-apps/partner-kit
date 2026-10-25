// Node server for the starter partner app (e2e and local development).
// Run: SABIVIDA_HOST=https://sabivida.com MINI_APP_ID=consulado node server.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createPartner } from './partner.mjs';

const PORT = Number(process.env.PORT ?? 4319);
const handle = createPartner({
  host: process.env.SABIVIDA_HOST ?? 'https://sabivida.com',
  appId: process.env.MINI_APP_ID ?? 'starter',
  sdkUrl: process.env.SDK_URL,
  jwks: process.env.SABIVIDA_JWKS,
  readAsset: (path) =>
    /^\/[a-z0-9/-]+\.[a-z]+$/.test(path) && !path.includes('..')
      ? readFile(new URL(`./public${path}`, import.meta.url), 'utf8').catch(() => null)
      : null,
});

createServer(async (incoming, outgoing) => {
  const chunks = [];
  for await (const chunk of incoming) chunks.push(chunk);
  const request = new Request(`http://localhost:${PORT}${incoming.url}`, {
    method: incoming.method,
    headers: incoming.headers,
    ...(['GET', 'HEAD'].includes(incoming.method) ? {} : { body: Buffer.concat(chunks) }),
  });
  const response = await handle(request);
  outgoing.writeHead(response.status, Object.fromEntries(response.headers));
  outgoing.end(Buffer.from(await response.arrayBuffer()));
}).listen(PORT, 'localhost', () => console.log(`Mini app starter on http://localhost:${PORT}`));

// Starter partner app for SabiVida mini apps, shared by the Node server
// (server.mjs) and the Cloudflare Worker (worker.mjs). It serves the app with
// a CSP that lets only SabiVida frame it, and verifies launch tokens against
// SabiVida's public keys: issuer, audience (your app id), type, algorithm and
// the 60-second expiry, and refuses a token id it has already seen.
import { createLocalJWKSet, createRemoteJWKSet, jwtVerify } from 'jose';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

// config: host (SabiVida origin), appId, sdkUrl (default: the host's SDK),
// jwks (optional JSON string of public keys, for hosts behind an access gate),
// readAsset(path) → file text or null.
export function createPartner({ host, appId, sdkUrl, jwks, readAsset }) {
  const keys = jwks
    ? createLocalJWKSet(JSON.parse(jwks))
    : createRemoteJWKSet(new URL('/api/mini-apps/jwks.json', host));
  const sdk = sdkUrl || new URL('/mini-apps/sdk/v1.js', host).href;
  // Token ids seen until they expire. One process only: a real partner keeps
  // them in its database.
  const used = new Map();
  const headers = {
    'Content-Security-Policy': `frame-ancestors ${host}`,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };

  async function session(request) {
    const raw = await request.text();
    if (raw.length > 8192) throw new Error('too large');
    const { token } = JSON.parse(raw);
    const { payload } = await jwtVerify(token, keys, {
      issuer: host,
      audience: appId,
      typ: 'sabivida-launch+jwt',
      algorithms: ['EdDSA'],
      maxTokenAge: '60s',
    });
    const now = Date.now();
    for (const [id, expiry] of used) if (expiry < now) used.delete(id);
    if (!payload.jti || used.has(payload.jti)) throw new Error('replayed');
    used.set(payload.jti, Number(payload.exp) * 1000);
    // `sub` is this member's id for your app only; `name` only with consent.
    return { subject: payload.sub, name: payload.name ?? null };
  }

  return async function handle(request) {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/session') {
      try {
        return Response.json(await session(request), { headers });
      } catch {
        return Response.json({ error: 'invalid launch token' }, { status: 401, headers });
      }
    }
    const path = url.pathname === '/' ? '/index.html' : url.pathname;
    const type = TYPES[path.slice(path.lastIndexOf('.'))];
    const body = request.method === 'GET' && type ? await readAsset(path) : null;
    if (body === null) return new Response(null, { status: 404, headers });
    const text =
      path === '/index.html'
        ? body.replaceAll('__SDK_URL__', sdk).replaceAll('__SABIVIDA_HOST__', host)
        : body;
    return new Response(text, { headers: { ...headers, 'Content-Type': type } });
  };
}

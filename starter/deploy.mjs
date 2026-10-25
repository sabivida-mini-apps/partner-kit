// Deploys the sample partner app to Cloudflare Workers.
// Usage: node starter/deploy.mjs --host <SabiVida origin> --app <id>
//          [--jwks <public JWKS JSON>]  (for a SabiVida host behind an access gate)
// With --jwks the app also serves its own copy of the SDK, which a gated host
// cannot serve to a partner frame.
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, rmSync } from 'node:fs';

const arg = (name) => {
  const index = process.argv.indexOf(`--${name}`);
  return index > 0 ? process.argv[index + 1] : undefined;
};
const host = arg('host');
const app = arg('app');
const jwks = arg('jwks');
if (!host || !app) throw new Error('Pass --host and --app.');
const here = new URL('.', import.meta.url);
const sdk = new URL('public/sdk/', here);
rmSync(sdk, { recursive: true, force: true });
if (jwks) {
  JSON.parse(jwks);
  mkdirSync(sdk, { recursive: true });
  copyFileSync(new URL('../sdk/v1.js', here), new URL('v1.js', sdk));
}
const vars = {
  SABIVIDA_HOST: host,
  MINI_APP_ID: app,
  ...(jwks ? { SABIVIDA_JWKS: jwks, SDK_URL: '/sdk/v1.js' } : {}),
};
execFileSync(
  'npx',
  [
    'wrangler',
    'deploy',
    '--config',
    new URL('wrangler.jsonc', here).pathname,
    ...Object.entries(vars).flatMap(([key, value]) => ['--var', `${key}:${value}`]),
  ],
  { stdio: 'inherit' },
);

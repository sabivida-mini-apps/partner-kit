// Cloudflare Worker for the starter partner app. Deploy with deploy.mjs.
import { createPartner } from './partner.mjs';

let handle;

export default {
  async fetch(request, env) {
    handle ??= createPartner({
      host: env.SABIVIDA_HOST,
      appId: env.MINI_APP_ID,
      sdkUrl: env.SDK_URL,
      jwks: env.SABIVIDA_JWKS,
      readAsset: async (path) => {
        const asset = await env.ASSETS.fetch(new URL(path, request.url));
        return asset.ok ? asset.text() : null;
      },
    });
    return handle(request);
  },
};

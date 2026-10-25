# SabiVida mini apps

Build web apps that open inside [SabiVida](https://sabivida.com), the household life-admin service for Cape Verdean families at home and across the diaspora. A mini app is your existing web app: SabiVida opens it full screen, signs the member in with a short-lived token, and lets you suggest steps for the household's plans. The member confirms every step.

Think Telegram Mini Apps, built consent-first. Each app receives a member id of its own and never sees household data, documents, plans, chat or contacts. Every SabiVida prompt stays in SabiVida's own interface.

## What's here

| Path | What it is |
| --- | --- |
| [`docs/developer-guide.md`](docs/developer-guide.md) | Requirements, quick start, token verification, SDK reference, deep links. Start here. |
| [`docs/protocol.md`](docs/protocol.md) | The frame protocol, the launch token claims and the compatibility promise. |
| [`sdk/v1.js`](sdk/v1.js) | Source of the SDK. Load it from `https://sabivida.com/mini-apps/sdk/v1.js`; this copy is for reading and offline testing. |
| [`starter/`](starter/) | A complete partner app with a verifying server, for Node or Cloudflare Workers. |
| [`CHANGELOG.md`](CHANGELOG.md) | Protocol and SDK changes. |

Public keys for token verification: `https://sabivida.com/api/mini-apps/jwks.json`.

## Quick start

```sh
git clone https://github.com/SabiVida/mini-apps.git
cd mini-apps/starter
npm install
SABIVIDA_HOST=https://sabivida.com MINI_APP_ID=your-app-id npm start
```

The starter serves your page on `http://localhost:4319` with `frame-ancestors` set to SabiVida. It verifies launch tokens on `POST /session` (issuer, audience, type, EdDSA, 60-second age, one use per token) and shows how to suggest a step with `SabiVida.addTask`. To deploy it as a Cloudflare Worker, run `npm run deploy -- --host https://sabivida.com --app your-app-id`.

## Become a partner

Partners are invited and reviewed. There is no self-service registration while SabiVida grows its first partnerships with consulates, carriers, associations, insurers and other services for the diaspora.

To apply, open an issue with the **Partner application** template and give only your organisation's name and the service you have in mind. **Do not post contracts, contact details or anything confidential in a public issue.** The SabiVida team replies with a private channel for the partner agreement.

## Security

Please report vulnerabilities privately as described in [SECURITY.md](SECURITY.md), never in a public issue.

<p><img src="https://raw.githubusercontent.com/sabivida-mini-apps/.github/main/assets/social-partner-kit.png" alt="SabiVida partner kit: guide, protocol and SDK to build a SabiVida mini app." width="100%"></p>

# SabiVida partner kit

Build web apps that open inside [SabiVida](https://sabivida.com), the household life-admin service for Cape Verdean families at home and across the diaspora. A mini app is your existing web app: SabiVida opens it full screen, signs the member in with a short-lived token, and lets you suggest steps for the household's plans. The member confirms every step.

It's built consent-first, for families. Each app gets a member id of its own and never sees household data, documents, plans, chat or contacts. Everything SabiVida asks the member happens in SabiVida's own interface, with the app's host always visible above it.

## What's here

| Path | What it is |
| --- | --- |
| [`docs/developer-guide.md`](docs/developer-guide.md) | Requirements, quick start, token verification, SDK reference, deep links. Start here. |
| [`docs/protocol.md`](docs/protocol.md) | The frame protocol, the launch token claims and the compatibility promise. |
| [`sdk/v1.js`](sdk/v1.js) | Source of the SDK. Load it from `https://sabivida.com/mini-apps/sdk/v1.js`; this copy is for reading and offline testing. |
| [`CHANGELOG.md`](CHANGELOG.md) | Protocol and SDK changes. |

Public keys for token verification: `https://sabivida.com/api/mini-apps/jwks.json`.

## Quick start

Start from the [first-app](https://github.com/sabivida-mini-apps/first-app) template (**Use this template**). It is a page plus a small server that verifies SabiVida's launch token, for Node or Cloudflare Workers.

## Become a partner

Partners are invited and reviewed. Apply through the [partner registry](https://github.com/sabivida-mini-apps/registry#become-a-partner), which also lists every genuine partner app.

## Security

Please report vulnerabilities privately as described in [SECURITY.md](SECURITY.md), never in a public issue.

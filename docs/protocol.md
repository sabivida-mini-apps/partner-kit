# Protocol reference

Protocol version **1**. Every message carries `sabivida: 1`. Messages without it are ignored.

## Launch

1. SabiVida opens `https://<your origin><entry path>` in a sandboxed frame on the web, or in an origin-locked web view in the iOS and Android apps.
2. Your page loads the SDK and calls `SabiVida.ready()`. The SDK posts `{ sabivida: 1, type: 'ready' }` to the SabiVida origin, never to `'*'`.
3. SabiVida answers with `launch`, sent to your registered origin only:

```json
{
  "sabivida": 1,
  "type": "launch",
  "token": "<EdDSA JWT>",
  "context": {
    "appId": "your-app-id",
    "locale": "kea-CV-x-santiago",
    "colorScheme": "light",
    "startParam": "passport",
    "platform": "web",
    "protocol": 1,
    "features": ["add_task"]
  }
}
```

If SabiVida can't sign a token, it sends `{ sabivida: 1, type: 'launch_failed', reason: 'unavailable' | 'rate_limited' }`. It mints at most one token every five seconds and reuses a token until 15 seconds before it expires.

`platform` is `web`, `ios` or `android`. In the apps your page is the top document, and the SDK gives it a `window.parent` that behaves like the web frame's parent. Detect SabiVida with `SabiVida.isEmbedded()`, never with `window.top !== window`.

## Launch token

Header: `alg` `EdDSA`, `typ` `sabivida-launch+jwt`, and `kid` (a key in `https://sabivida.com/api/mini-apps/jwks.json`).

| Claim | Meaning |
| --- | --- |
| `iss` | `https://sabivida.com` |
| `aud` | Your app id |
| `sub` | The member's id for your app only. Stable across reconnects; a new origin or publisher gives every member a new one. |
| `iat`, `exp` | `exp` is 60 seconds after `iat` |
| `jti` | Unique token id. Accept each one once. |
| `scope` | `profile` when the member agreed to share their name, otherwise empty |
| `name` | Display name, with `profile` only |
| `locale` | The member's language |
| `start_param` | The deep-link parameter, when the link had one |

Verify the signature, `typ`, `iss`, `aud`, `exp` and `jti`, then open your own session. A launch token is proof of sign-in, not a session.

## Messages from your app

| Message | Effect |
| --- | --- |
| `{ type: 'ready' }` | Asks for a (fresh) launch token. |
| `{ type: 'close' }` | Closes your app and returns the member to SabiVida. |
| `{ type: 'add_task', requestId, title, dueDate }` | Suggests a plan step. `requestId` is 1 to 64 characters from `A-Z a-z 0-9 _ -`; `title` is 1 to 120 characters; `dueDate` is `YYYY-MM-DD` or `null`. Only for apps with the `add_task` feature. One suggestion at a time. |

SabiVida answers `add_task` with `{ type: 'task_result', requestId, status }`, where `status` is `added`, `declined` or `unavailable`. The member sees the exact text, the date, your app's name and your host before deciding.

## What SabiVida guarantees

- SabiVida only accepts messages from your frame window at your registered origin, and only posts to that origin.
- Consent, task confirmation, reports and disconnection are SabiVida screens drawn outside your page. Your page can't draw them, and members are told SabiVida never asks for passkeys or recovery codes inside an app.
- No camera, microphone, location, clipboard or payment access is delegated to your page.

## Compatibility promise

Protocol 1 stays compatible: new message types and context fields may be added, so ignore what you don't know. Breaking changes get a new protocol number and at least 12 months' notice in [CHANGELOG.md](../CHANGELOG.md).

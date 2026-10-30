# Build a SabiVida mini app

A SabiVida mini app is your existing web app, opened inside SabiVida for Cape Verdean members around the world. SabiVida signs the member in for you with a short-lived token and lets you suggest steps for their household plans. The message protocol, token claims and compatibility promise are in [the protocol reference](protocol.md).

Partners are invited and reviewed. There is no self-service registration: apply through the [partner registry](https://github.com/sabivida-mini-apps/registry#become-a-partner).

## What you get, what you never get

| You receive                                                           | You never receive                                        |
| --------------------------------------------------------------------- | -------------------------------------------------------- |
| A member id that only your app sees (`sub`), stable across reconnects | The member's SabiVida id, username, email or phone       |
| The member's display name, only if they tick the box                  | Household, documents, plans, deadlines, chat or contacts |
| The member's language (`locale`) and a deep-link parameter            | Anything about other members                             |
| The ability to suggest a step; the member confirms it in SabiVida     | Any write the member did not confirm, payments, push     |

## Requirements before review

1. **HTTPS origin of your own.** One origin per app, not on `sabivida.com`, no IP address, no port. Changing the origin or the publisher later sends the app back to review and asks every member to consent again.
2. **Allow SabiVida to frame you, and nobody else:** `Content-Security-Policy: frame-ancestors https://app.sabivida.com https://sabivida.com`. List both hosts: see [Moving to app.sabivida.com](#moving-to-appsabividacom).
3. **Sessions without third-party cookies.** Safari and Firefox block or partition cookies in frames. Exchange the launch token for your own session and keep it in memory, or in a `SameSite=None; Secure; Partitioned` cookie.
4. **No advertising or tracking SDKs** in the framed app, and no analytics cookies without your own valid consent.
5. **Never ask for SabiVida credentials,** passkeys, recovery codes or one-time codes. SabiVida tells members it never does.
6. **No rewards for sharing or inviting,** no points or tokens for using the app.
7. **A privacy policy** that names you as controller of the data you receive, and a contact address. Under the partner agreement you and SabiVida share responsibility for the hand-over (GDPR art. 26); you are responsible for everything after it.
8. **Your app must work in a sandboxed frame:** scripts, forms, your own storage, downloads and links in new tabs work; `alert`/`confirm`, top-level navigation, camera, microphone, location and clipboard writes do not.
9. **Stay on your origin inside the frame.** SabiVida's page allows frames from your registered origin only, so the frame cannot navigate to another site. Open third-party sign-in, payment or document pages in a new tab (`target="_blank"`), where the browser shows their address.

## Quick start

```html
<script src="https://app.sabivida.com/mini-apps/sdk/v1.js"></script>
<script>
  const { token, context } = await SabiVida.ready();
  // Send the token to your server at once: it expires after 60 seconds.
  const member = await fetch('/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  }).then((response) => response.json());
</script>
```

Complete partner apps with a verifying server, one per stack:

| Template | Stack |
| --- | --- |
| [starter-react](https://github.com/sabivida-mini-apps/starter-react) | React, Vite, TypeScript, Cloudflare Worker |
| [starter-next](https://github.com/sabivida-mini-apps/starter-next) | Next.js App Router, TypeScript |
| [starter-vue](https://github.com/sabivida-mini-apps/starter-vue) | Vue, Vite, TypeScript, Cloudflare Worker |
| [starter-solid](https://github.com/sabivida-mini-apps/starter-solid) | Solid, Vite, TypeScript, Cloudflare Worker |
| [starter-js](https://github.com/sabivida-mini-apps/starter-js) | Plain JavaScript, Node or Cloudflare Worker |

Each one is a template repository (**Use this template**). They all:
- verify the launch token on your server;
- send `frame-ancestors`, so only SabiVida can frame them;
- include `npm run dev:mock`, a local stand-in for SabiVida that frames your app, signs a test member in and answers step suggestions, so you can build before SabiVida registers your app.

The staging host is behind an access gate, so a partner server cannot fetch its JWKS and a partner frame cannot load its SDK. For staging, ask the SabiVida team for the staging public keys and deploy with `--jwks '<keys JSON>'`. The app then verifies against those keys and serves its own copy of the SDK. Set `data-sabivida-host` on the SDK script tag to the staging origin (the templates do this). Leave it out in production: by default the SDK talks to whichever of `https://app.sabivida.com` and `https://sabivida.com` frames your app.

## Moving to app.sabivida.com

SabiVida's web app is moving from `https://sabivida.com` to `https://app.sabivida.com`. During the move both hosts frame your app. Afterwards members open it from `https://app.sabivida.com` on the web, while older versions of the iOS and Android apps still present `https://sabivida.com`. Keep both.

Change:

- **`frame-ancestors`:** send `Content-Security-Policy: frame-ancestors https://app.sabivida.com https://sabivida.com`. With `https://sabivida.com` alone, your app fails to load on the new host.
- **`data-sabivida-host`:** if your SDK script tag sets it to `https://sabivida.com`, remove it. It limits the SDK to that one origin, so your app never gets a launch token on the new host. Without it, the SDK talks to both hosts and keeps to the one that answers. Set it only for staging.
- **SDK address:** load `https://app.sabivida.com/mini-apps/sdk/v1.js`. The old address serves the same file.

Keep:

- **Issuer:** launch tokens keep `iss` `https://sabivida.com` on both hosts. Don't change your check to the new host, or every launch fails.
- **Public keys:** `https://sabivida.com/api/mini-apps/jwks.json` keeps working. `https://app.sabivida.com/api/mini-apps/jwks.json` serves the same keys; new code can use either.

The [templates](#quick-start) do all of this with their default host, `https://app.sabivida.com`: they list both hosts in `frame-ancestors`, check the `https://sabivida.com` issuer and leave `data-sabivida-host` out.

## Verify the launch token on your server

The token is an EdDSA JWT. Public keys: `https://app.sabivida.com/api/mini-apps/jwks.json` (cache it; keys are identified by `kid`). `https://sabivida.com/api/mini-apps/jwks.json` serves the same keys and keeps working.

Check every one of these, or reject the token:

- signature with a key from the JWKS, algorithm `EdDSA` only;
- header `typ` is `sabivida-launch+jwt`;
- `iss` is `https://sabivida.com`, whichever host framed your app;
- `aud` is your app id;
- `exp` has not passed (60 seconds after `iat`);
- `jti` was never seen before (keep used ids until they expire).

```js
import { createRemoteJWKSet, jwtVerify } from 'jose';

const keys = createRemoteJWKSet(new URL('https://app.sabivida.com/api/mini-apps/jwks.json'));

export async function verifyLaunch(token) {
  const { payload } = await jwtVerify(token, keys, {
    issuer: 'https://sabivida.com',
    audience: 'your-app-id',
    typ: 'sabivida-launch+jwt',
    algorithms: ['EdDSA'],
    maxTokenAge: '60s',
  });
  // Also reject a payload.jti you have already accepted.
  return { subject: payload.sub, name: payload.name ?? null, locale: payload.locale };
}
```

Claims: `sub` (your member id), `scope` (`profile` or empty), `name` (with `profile` only), `locale` (`kea-CV-x-santiago` and other Kriolu varieties, `en`, `fr`), `start_param` (when the link had one).

## SDK reference

| Call                                   | Result                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `SabiVida.ready({ timeout })`          | `{ token, context }`; rejects `not_embedded`, `timeout`, `unavailable` or `rate_limited`.         |
| `SabiVida.context()`                   | Last context: `appId`, `locale`, `colorScheme`, `startParam`, `platform`, `protocol`, `features`. |
| `SabiVida.supports('add_task')`        | Whether SabiVida lets this app suggest steps.                                                     |
| `SabiVida.addTask({ title, dueDate })` | `'added'`, `'declined'` or `'unavailable'`. Title up to 120 characters, date `YYYY-MM-DD`.        |
| `SabiVida.close()`                     | Returns the member to SabiVida's app list.                                                        |
| `SabiVida.isEmbedded()`                | False when your page runs outside SabiVida.                                                       |

Call `ready()` again when you need a fresh token; SabiVida mints at most one every five seconds. Treat `context` as a display hint: only the verified token is proof of who the member is.

`platform` is `web` on app.sabivida.com and sabivida.com, and `ios` or `android` in the SabiVida app, which hosts the same page with the same SDK: the app gives your page a `window.parent` that behaves like the web frame's parent, so no code changes. There your page is the top document, so detect SabiVida with `SabiVida.isEmbedded()`, never `window.top !== window`.

The member sees every suggested step in a SabiVida sheet with your app's name and host before it is added. Suggest steps the member asked for, one at a time; the steps show "Via <your app>" in the household plan.

## Deep links

`https://app.sabivida.com/apps/<your-app-id>?start=<param>` opens your app (links on `https://sabivida.com/apps/` keep working); `<param>` (1 to 64 of `A-Z a-z 0-9 _ -`) arrives as `context.startParam` and `start_param`. Put it on posters, consulate desks or messages; never put personal data in it.

## Look and feel

SabiVida runs your app full screen. Above it sits one compact SabiVida bar, 44 px tall:
- on the left, close and SabiVida's mark;
- then your app's name, a verified or unverified mark (verified once your publisher identity is checked) and your host;
- on the right, minimize and a menu: App info, Reload, Add to Home Screen, your Terms of Use if you have them, Report and Log out.

Your app fills the rest of the screen, below the bar.

- **Reload** gives you a fresh frame, which calls `ready()` again.
- **Minimize** hides your app without stopping it. While minimized, `addTask` answers `'unavailable'`.
- **Log out** withdraws the member's consent; the next open asks for consent again.

SabiVida uses a light theme. Use `context.locale` to pick Kriolu, Portuguese, French or English.

## Rules SabiVida follows with you

- Protocol 1 stays compatible. Breaking changes are announced at least 12 months ahead.
- Members can report your app. Three reports from different members suspend it until the team reviews it; you are told why at your contact address.
- Consent lapses after 90 days without a launch; the member reconnects with one tap and keeps the same `sub`. A change of origin or publisher gives every member a new `sub`: plan account migration before you ask for one.

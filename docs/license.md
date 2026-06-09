# Offline License Codes

This plugin uses a no-backend licensing model.

## What the plugin does

- Stores usage in `figma.clientStorage`.
- Allows 10 free SVGA exports per plugin installation.
- Blocks export after the free quota is used unless a valid license code is activated.
- Shows the embedded contact QR code and the local authorization ID.
- Verifies license codes with an embedded ECDSA P-256 public key.

## Why this avoids a backend

The plugin ships only the public verification key. You keep the private signing key locally. A valid license code is a signed JSON payload:

```text
SVGA1.<base64url payload>.<base64url signature>
```

Because the plugin has the public key, it can verify that a code was signed by your private key without contacting a server.

## Important limitation

No-backend licensing cannot be perfectly tamper-proof. A determined user can modify plugin code. The practical goal here is controlled distribution for normal users without operating a server.

## Setup

Generate a private key and write the matching public key into `src/ui.html`:

```bash
npm run license:keygen
```

This creates:

```text
license-private-key.pem
```

Keep this file private. It is ignored by `.gitignore`.

## Issue a code

Ask the user to send the `授权识别码` shown in the plugin. Then run:

```bash
npm run license:code -- --customer "客户名" --installation-id "figma-xxxx" --days 365
```

Send the printed `SVGA1...` code to the user.

## Shareable code

For a non-device-bound code:

```bash
npm run license:code -- --customer "客户名" --all-devices --days 365
```

This is easier to share, but also easier for users to forward.

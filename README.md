# SVGA Editor Public Runtime

This repository is **deployment-only**.

It contains only the minimum public runtime required for the SVGA Editor GitHub Pages services.

The following are intentionally excluded and must never be committed here:

- Figma plugin source code
- animation/rendering algorithms
- SVGA/PAG/GIF/WebP/Lottie export implementations
- protobuf/encoding/compression implementation
- Supabase Edge Functions
- GPT/plugin source
- internal scripts/tests
- private keys, service-role keys, API secrets, or admin passwords

All development happens in the private source repository.

A `Public Source Guard` GitHub Actions workflow blocks known private source paths, core implementation identifiers, and sensitive secret markers from being introduced into this repository.

The standalone sequence-frame tool is available at `sequence/`. It processes user-selected images locally in the browser and keeps the supplied tool’s PNG sequence, WebP and GIF exports. It does not include Figma plugin source or private SVGA/PAG implementations.

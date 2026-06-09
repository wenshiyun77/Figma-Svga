# Roadmap

## Phase 1 - MVP in this project

- Import selected Figma layers as PNG assets.
- Preserve selection bounding box and per-layer placement.
- Recreate the imported canvas at 1:1 size in the plugin preview.
- Track Figma layer names and node ids for per-layer refresh.
- Highlight imported layers when the matching Figma node changes.
- Configure basic layer animation: none, float, swing, pulse, spin.
- Encode a valid SVGA movie inside the Figma plugin UI.
- Download `.svga` directly from the plugin.
- Gate exports with 10 free uses and offline signed license codes.

## Phase 2 - Better editor parity

- Add layer reorder, visibility, opacity, and locked-state controls.
- Add timeline preview in the plugin UI.
- Add sequence-frame import for frame-by-frame material layers.
- Add sweep and particle effect configuration.
- Add shape/text-native export where SVGA player compatibility is acceptable.

## Phase 3 - Production hardening

- Add signed private plugin metadata before publishing.
- Add persistent user settings for FPS, frame count, and default export scale.
- Add automated regression fixtures for SVGA binary encoding.
- Add decoded-SVGA validation fixtures against common SVGA players.
- Consider optional server-side validation only if license sharing becomes a real problem.

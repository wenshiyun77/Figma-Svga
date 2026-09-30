export function displacementFrameCount(material) {
  const storedFrames = material.frames?.length || 0;
  return storedFrames || (material.presetKey ? 12 : 0);
}

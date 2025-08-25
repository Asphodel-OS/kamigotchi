import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ShaderStack, ShaderLayer } from './ShaderStack';

// Import fragment shader strings from our existing components by exporting them, or copy inline.
// Here we import the TSX components and grab their shader strings via small helpers to avoid duplication.
import { makeSteamLayer } from './SteamShader';
import { makeLightningLayer } from './LightningShader';

// We’ll reuse the existing components to access their fragment shaders by instantiating once and reading the const.
// Simpler: duplicate shader strings by exporting helpers from those files would be ideal, but to keep this change focused,
// we create small wrappers that construct same uniforms and onBeforeFrame used by each shader component.

interface CooldownStackProps {
  shaped: number; // 0..1 cooldown-shaped intensity
}

export const CooldownStack: React.FC<CooldownStackProps> = ({ shaped }) => {
  // Build layers in order: lightning then steam
  const layers: ShaderLayer[] = useMemo(() => [
    makeLightningLayer({ intensity: Math.max(0.05, shaped), brightness: 1.6, alpha: 0.85, vertical: true }),
    makeSteamLayer({ speed: 0.25, density: 0.05 + 1.95 * shaped, brightness: 0.88, alpha: (0.2 + 0.8 * shaped) * 0.8, hue: 0.0, vertical: true }),
  ], [shaped]);

  return <ShaderStack layers={layers} transparent />;
};

export default CooldownStack;



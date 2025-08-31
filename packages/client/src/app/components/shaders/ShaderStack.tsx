import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface ShaderLayer {
  fragmentShader: string;
  uniforms?: Record<string, THREE.IUniform>;
  onBeforeFrame?: (
    uniforms: Record<string, THREE.IUniform>,
    timeSeconds: number,
    size: { width: number; height: number }
  ) => void;
  blending?: THREE.Blending;
}

interface ShaderStackProps {
  layers: ShaderLayer[];
  className?: string;
  style?: React.CSSProperties;
  paused?: boolean;
  capDevicePixelRatio?: number; // default 2
  transparent?: boolean; // true for overlay effects
  animateWhenOffscreen?: boolean; // default false
}

// A single WebGL canvas rendering multiple full-screen shader layers in order.
let ACTIVE_CONTEXTS = 0;
const MAX_CONTEXTS = 8; // conservative; tune as needed
const tryAcquireContext = () => {
  if (ACTIVE_CONTEXTS >= MAX_CONTEXTS) return false;
  ACTIVE_CONTEXTS += 1;
  return true;
};
const releaseContext = () => { if (ACTIVE_CONTEXTS > 0) ACTIVE_CONTEXTS -= 1; };

export const ShaderStack: React.FC<ShaderStackProps> = ({
  layers,
  className,
  style,
  paused = false,
  capDevicePixelRatio = 2,
  transparent = true,
  animateWhenOffscreen = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const geometryRef = useRef<THREE.PlaneGeometry | null>(null);
  const materialsRef = useRef<THREE.ShaderMaterial[]>([]);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(performance.now());
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const ioRef = useRef<IntersectionObserver | null>(null);
  const contextAcquiredRef = useRef<boolean>(false);

  const init = () => {
    const container = containerRef.current;
    if (!container || rendererRef.current) return;

    if (!tryAcquireContext()) return;
    contextAcquiredRef.current = true;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: transparent, powerPreference: 'high-performance' });
    renderer.autoClear = false;
    renderer.setClearColor(0x000000, transparent ? 0 : 1);
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
    };
    const handleContextRestored = () => {
      if (resizeObserverRef.current && containerRef.current) {
        const r = rendererRef.current;
        if (r) {
          const dpr = Math.min(window.devicePixelRatio || 1, capDevicePixelRatio);
          const width = containerRef.current.clientWidth || 1;
          const height = containerRef.current.clientHeight || 1;
          r.setPixelRatio(dpr);
          r.setSize(width, height, false);
          for (const mat of materialsRef.current) {
            const u = mat.uniforms;
            if (u.iResolution) u.iResolution.value.set(width, height, dpr);
            (mat as any).needsUpdate = true;
          }
        }
      }
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost as EventListener, false);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored as EventListener, false);
    // Stash handlers for cleanup
    (renderer as any).userData ??= {};
    (renderer as any).userData.__ctxHandlers = {
      lost: handleContextLost as EventListener,
      restored: handleContextRestored as EventListener,
    };

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    cameraRef.current = camera;

    const geometry = new THREE.PlaneGeometry(2, 2);
    geometryRef.current = geometry;

    const mesh = new THREE.Mesh(geometry);
    meshRef.current = mesh;
    scene.add(mesh);

    const mats: THREE.ShaderMaterial[] = layers.map((layer) => {
      const mergedUniforms: Record<string, THREE.IUniform> = {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector3(1, 1, window.devicePixelRatio || 1) },
        ...(layer.uniforms ?? {}),
      };
      const mat = new THREE.ShaderMaterial({
        uniforms: mergedUniforms,
        vertexShader: `
          varying vec2 vUv;
          void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }
        `,
        fragmentShader: layer.fragmentShader,
        transparent: true,
        blending: layer.blending ?? THREE.NormalBlending,
        depthTest: false,
        depthWrite: false,
      });
      return mat;
    });
    materialsRef.current = mats;

    const resize = () => {
      if (!rendererRef.current || !containerRef.current) return;
      const dpr = Math.min(window.devicePixelRatio || 1, capDevicePixelRatio);
      const width = containerRef.current.clientWidth || 1;
      const height = containerRef.current.clientHeight || 1;
      rendererRef.current.setPixelRatio(dpr);
      rendererRef.current.setSize(width, height, false);
      for (const mat of materialsRef.current) {
        const u = mat.uniforms;
        if (u.iResolution) u.iResolution.value.set(width, height, dpr);
      }
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resizeObserverRef.current = ro;
  };

  const disposeAll = () => {
    if (frameRef.current) { cancelAnimationFrame(frameRef.current); frameRef.current = null; }
    const container = containerRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const mesh = meshRef.current;
    const geometry = geometryRef.current;
    if (resizeObserverRef.current) { resizeObserverRef.current.disconnect(); resizeObserverRef.current = null; }
    if (mesh && scene) scene.remove(mesh);
    if (geometry) geometry.dispose();
    for (const m of materialsRef.current) m.dispose();
    materialsRef.current = [];
    if (renderer) {
      const el = renderer.domElement;
      const ctx = (renderer as any).userData?.__ctxHandlers;
      if (el && ctx) {
        if (ctx.lost) el.removeEventListener('webglcontextlost', ctx.lost);
        if (ctx.restored) el.removeEventListener('webglcontextrestored', ctx.restored);
        (renderer as any).userData.__ctxHandlers = undefined;
      }
      renderer.dispose();
      if (renderer.domElement && container && renderer.domElement.parentElement === container) container.removeChild(renderer.domElement);
    }
    rendererRef.current = null;
    sceneRef.current = null;
    cameraRef.current = null;
    meshRef.current = null;
    geometryRef.current = null;
    if (contextAcquiredRef.current) { releaseContext(); contextAcquiredRef.current = false; }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!animateWhenOffscreen && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        for (const entry of entries) setIsVisible(entry.isIntersecting);
      }, { root: null, threshold: 0 });
      io.observe(container);
      ioRef.current = io;
    } else if (animateWhenOffscreen) {
      setIsVisible(true);
    }
    return () => { if (ioRef.current) { ioRef.current.disconnect(); ioRef.current = null; } };
  }, [animateWhenOffscreen]);

  useEffect(() => {
    if (!paused && (isVisible || animateWhenOffscreen)) {
      if (!rendererRef.current) init();
    } else {
      if (rendererRef.current) disposeAll();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, isVisible, animateWhenOffscreen, layers]);

  useEffect(() => {
    const loop = () => {
      frameRef.current = null;
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const mesh = meshRef.current;
      if (!renderer || !scene || !camera || !mesh) return;
      if (paused || (!isVisible && !animateWhenOffscreen)) return;
      const now = performance.now();
      const t = (now - startTimeRef.current) / 1000;

      // Defensive: ensure canvas size/uniforms match container each frame for early mounts
      const container = containerRef.current;
      if (container) {
        const dpr = Math.min(window.devicePixelRatio || 1, capDevicePixelRatio);
        const cw = container.clientWidth || 1;
        const ch = container.clientHeight || 1;
        const rw = Math.round((renderer.domElement.width || 1) / dpr);
        const rh = Math.round((renderer.domElement.height || 1) / dpr);
        if (rw !== cw || rh !== ch) {
          renderer.setPixelRatio(dpr);
          renderer.setSize(cw, ch, false);
          for (const mat of materialsRef.current) {
            const u = mat.uniforms;
            if (u.iResolution) u.iResolution.value.set(cw, ch, dpr);
          }
        }
      }

      renderer.clear();
      const width = renderer.domElement.width;
      const height = renderer.domElement.height;
      for (let i = 0; i < materialsRef.current.length; i++) {
        const mat = materialsRef.current[i];
        if (mat.uniforms.iTime) mat.uniforms.iTime.value = t;
        const layer = layers[i];
        if (layer && layer.onBeforeFrame) layer.onBeforeFrame(mat.uniforms, t, { width, height });
        mesh.material = mat;
        renderer.render(scene, camera);
      }
      frameRef.current = requestAnimationFrame(loop);
    };
    if (rendererRef.current) frameRef.current = requestAnimationFrame(loop);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [layers, paused, isVisible, animateWhenOffscreen]);

  useEffect(() => {
    if (paused) return;
    if (!frameRef.current) frameRef.current = requestAnimationFrame(() => {});
  }, [paused]);

  return (
    <div ref={containerRef} className={className} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...style }} />
  );
};

export default ShaderStack;



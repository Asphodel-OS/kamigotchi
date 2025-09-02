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
// This avoids spinning up multiple WebGL contexts for stacked effects.
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
  // Set lazily in the render loop to avoid SSR "performance is undefined"
  const startTimeRef = useRef<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const ioRef = useRef<IntersectionObserver | null>(null);

  const init = () => {
    const container = containerRef.current;
    if (!container || rendererRef.current) return;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: transparent, powerPreference: 'high-performance' });
    renderer.autoClear = false;
    renderer.setClearColor(0x000000, transparent ? 0 : 1);
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

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
      renderer.dispose();
      if (renderer.domElement && container && renderer.domElement.parentElement === container) container.removeChild(renderer.domElement);
    }
    rendererRef.current = null;
    sceneRef.current = null;
    cameraRef.current = null;
    meshRef.current = null;
    geometryRef.current = null;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!animateWhenOffscreen && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        for (const entry of entries) setIsVisible(entry.isIntersecting);
      });
      io.observe(container);
      ioRef.current = io;
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
      // Initialize startTimeRef on first client-side frame
      if (startTimeRef.current === 0 && typeof performance !== 'undefined') {
        startTimeRef.current = performance.now();
      }
      const now = performance.now();
      const t = (now - startTimeRef.current) / 1000;

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
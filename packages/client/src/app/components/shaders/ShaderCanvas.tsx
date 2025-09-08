import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ShaderCanvasProps {
  fragmentShader: string;
  uniforms?: Record<string, THREE.IUniform>;
  className?: string;
  style?: React.CSSProperties;
  paused?: boolean;
  capDevicePixelRatio?: number; // caps DPR for perf; default 2
  transparent?: boolean; // true for overlay effects
  animateWhenOffscreen?: boolean; // default false
  maxFps?: number; // optional FPS cap; default 60
  pauseWhenHidden?: boolean; // pause when document is hidden; default true
  onBeforeFrame?: (uniforms: Record<string, THREE.IUniform>, timeSeconds: number, size: { width: number; height: number }) => void;
}

export const ShaderCanvas: React.FC<ShaderCanvasProps> = (props) => {
  const {
    fragmentShader,
    uniforms = {},
    className,
    style,
    paused = false,
    capDevicePixelRatio = 2,
    transparent = true,
    animateWhenOffscreen = false,
    maxFps = 60,
    pauseWhenHidden = true,
    onBeforeFrame,
  } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(performance.now());
  const isVisibleRef = useRef<boolean>(true);
  const pageVisibleRef = useRef<boolean>(typeof document !== 'undefined' ? document.visibilityState !== 'hidden' : true);
  const lastFrameTimeRef = useRef<number>(0);

	useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: transparent, powerPreference: 'low-power' });
    renderer.setClearColor(0x000000, transparent ? 0 : 1);
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    cameraRef.current = camera;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mergedUniforms: Record<string, THREE.IUniform> = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector3(1, 1, window.devicePixelRatio || 1) },
      ...uniforms,
    };
    const material = new THREE.ShaderMaterial({
      uniforms: mergedUniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader,
      transparent,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    meshRef.current = mesh;
    scene.add(mesh);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, capDevicePixelRatio);
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      const uniformsObj = (material as THREE.ShaderMaterial).uniforms;
      if (uniformsObj.iResolution) uniformsObj.iResolution.value.set(width, height, dpr);
    };
    resize();

    const obs = new ResizeObserver(resize);
    obs.observe(container);

    let io: IntersectionObserver | null = null;
    if (!animateWhenOffscreen && 'IntersectionObserver' in window) {
      io = new IntersectionObserver((entries) => {
        for (const entry of entries) isVisibleRef.current = entry.isIntersecting;
      });
      io.observe(container);
    }

    const handleVisibility = () => {
      if (!pauseWhenHidden) return;
      pageVisibleRef.current = document.visibilityState !== 'hidden';
      if (!pageVisibleRef.current && frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      } else if (pageVisibleRef.current && !frameRef.current) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    if (pauseWhenHidden && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    const animate = () => {
      frameRef.current = null; // mark frame processed
      if (paused) return;
      if (!animateWhenOffscreen && !isVisibleRef.current) return;
      if (pauseWhenHidden && !pageVisibleRef.current) return;
      const nowMs = performance.now();
      if (maxFps > 0) {
        const minDelta = 1000 / Math.max(1, maxFps);
        if (nowMs - lastFrameTimeRef.current < minDelta) {
          frameRef.current = requestAnimationFrame(animate);
          return;
        }
        lastFrameTimeRef.current = nowMs;
      }
      const t = (nowMs - startTimeRef.current) / 1000;
      const mat = mesh.material as THREE.ShaderMaterial;
      if (mat.uniforms.iTime) mat.uniforms.iTime.value = t;
      if (onBeforeFrame) {
        onBeforeFrame(mat.uniforms, t, {
          width: renderer.domElement.width,
          height: renderer.domElement.height,
        });
      }
      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (io) io.disconnect();
      if (pauseWhenHidden && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
      obs.disconnect();
      scene.remove(mesh);
      geometry.dispose();
      (material as THREE.ShaderMaterial).dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) container.removeChild(renderer.domElement);
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      meshRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

	useEffect(() => {
    if (paused) return;
    if (!frameRef.current) frameRef.current = requestAnimationFrame(() => {
    });
  }, [paused]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...style }}
    />
  );
};

export default ShaderCanvas;



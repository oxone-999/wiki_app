import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Text } from '@react-three/drei';
import * as THREE from 'three';
import { mediumUrl, thumbUrl } from '../api/client.js';

// Deterministic pseudo-random so layout is stable across renders.
function rng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// One shared 1x1 geometry for every plane; each mesh is scaled to its own
// image aspect ratio so photos never stretch (huge GC/draw-call win too).
const PLANE_GEO = new THREE.PlaneGeometry(1, 1);
const BASE = 3.8; // longest side of a plane, world units

/**
 * Concurrency-limited texture streamer.
 * Decodes thumbnails off the main thread via ImageBitmapLoader, ~N at a time,
 * so the page never blocks on a giant simultaneous decode. Falls back to the
 * full-res image if a thumbnail 404s. Calls onLoad(filename, texture) per photo.
 */
function useStreamedTextures(filenames, onProgress) {
  const texMapRef = useRef(new Map());
  const [, force] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.ImageBitmapLoader();
    loader.setOptions({ imageOrientation: 'flipY', premultiplyAlpha: 'none' });
    const map = texMapRef.current;
    let i = 0;
    let done = 0;

    const makeTexture = (bitmap) => {
      const t = new THREE.CanvasTexture(bitmap);
      t.colorSpace = THREE.SRGBColorSpace;
      t.generateMipmaps = true;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.anisotropy = 2;
      return t;
    };

    const loadOne = (file) =>
      new Promise((resolve) => {
        const tryUrl = (url, isFallback) => {
          loader.load(
            url,
            (bitmap) => {
              if (cancelled) return resolve();
              map.set(file, {
                texture: makeTexture(bitmap),
                aspect: bitmap.width / bitmap.height,
              });
              resolve();
            },
            undefined,
            () => {
              // thumb missing -> try full-res once, else give up.
              if (!isFallback) tryUrl(mediumUrl(file), true);
              else resolve();
            }
          );
        };
        tryUrl(thumbUrl(file), false);
      });

    const CONC = 8;
    async function worker() {
      while (!cancelled && i < filenames.length) {
        const file = filenames[i++];
        await loadOne(file);
        done++;
        onProgress?.(done, filenames.length);
        force((n) => n + 1); // reveal newly-loaded planes
      }
    }
    Promise.all(Array.from({ length: CONC }, worker));

    return () => {
      cancelled = true;
      map.forEach((entry) => entry.texture?.dispose());
      map.clear();
    };
  }, [filenames, onProgress]);

  return texMapRef.current;
}

function Swarm({ photos, onFocus, onProgress }) {
  const { camera } = useThree();
  const groupRef = useRef();
  const meshRefs = useRef([]);

  const items = useMemo(() => {
    const rand = rng(12345);
    return photos.map((filename, i) => {
      const ring = i % 5;
      const radius = 10 + ring * 3.2;
      const phi = Math.acos(1 - 2 * rand());
      const theta = 2 * Math.PI * rand();
      return {
        filename,
        position: [
          radius * Math.sin(phi) * Math.cos(theta),
          (rand() - 0.5) * 16,
          radius * Math.sin(phi) * Math.sin(theta),
        ],
        bob: rand() * Math.PI * 2,
      };
    });
  }, [photos]);

  const textures = useStreamedTextures(photos, onProgress);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const meshes = meshRefs.current;
    for (let k = 0; k < meshes.length; k++) {
      const m = meshes[k];
      if (!m) continue;
      m.position.y = m.userData.baseY + Math.sin(t * 0.4 + m.userData.bob) * 0.4;
      // Cheap billboard: copy camera orientation (no per-plane lookAt/matrix invert).
      m.quaternion.copy(camera.quaternion);
      // Scale to the photo's real aspect ratio so it never stretches.
      const entry = textures.get(items[k].filename);
      const a = entry?.aspect;
      if (a) {
        if (a >= 1) m.scale.set(BASE, BASE / a, 1);
        else m.scale.set(BASE * a, BASE, 1);
      } else {
        m.scale.set(BASE * 0.85, BASE * 0.85, 1); // placeholder square
      }
    }
  });

  return (
    <group ref={groupRef}>
      {items.map((it, idx) => {
        const tex = textures.get(it.filename)?.texture;
        return (
          <mesh
            key={it.filename}
            ref={(el) => {
              meshRefs.current[idx] = el;
              if (el) {
                el.userData.baseY = it.position[1];
                el.userData.bob = it.bob;
              }
            }}
            geometry={PLANE_GEO}
            position={it.position}
            onClick={(e) => {
              e.stopPropagation();
              onFocus?.(it.filename);
            }}
          >
            <meshBasicMaterial
              map={tex || null}
              color={tex ? '#ffffff' : '#2a1840'}
              transparent
              opacity={tex ? 1 : 0.35}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default function PhotoUniverse({ photos }) {
  const [focused, setFocused] = useState(null);
  const [progress, setProgress] = useState({ done: 0, total: photos.length });

  const onProgress = useMemo(
    () => (done, total) => setProgress({ done, total }),
    []
  );

  return (
    <>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 24], fov: 60 }}
      >
        <color attach="background" args={['#120322']} />
        <fog attach="fog" args={['#1a0530', 20, 50]} />
        <ambientLight intensity={1.2} />
        <Stars radius={120} depth={60} count={1200} factor={4} fade speed={1} />

        {photos.length > 0 ? (
          <Swarm photos={photos} onFocus={setFocused} onProgress={onProgress} />
        ) : (
          <Text fontSize={1} color="#ffd0e2" anchorX="center" anchorY="middle">
            drop photos into server/photos
          </Text>
        )}

        <OrbitControls
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.35}
          minDistance={9}
          maxDistance={44}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>

      {photos.length > 0 && progress.done < progress.total && (
        <div className="universe-progress">
          summoning her universe… {progress.done}/{progress.total}
        </div>
      )}

      {focused && (
        <div className="universe-focus" onClick={() => setFocused(null)}>
          <img src={mediumUrl(focused)} alt="her" />
          <p>click anywhere to close</p>
        </div>
      )}
    </>
  );
}

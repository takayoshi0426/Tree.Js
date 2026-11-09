import * as THREE from 'three';

export const WORLD_RADIUS = 60;

// 空・光・地面・木や岩を配置したシンプルなフィールド
export function createWorld(scene) {
  // ===== 空とフォグ =====
  scene.background = new THREE.Color(0x9fd3ff);
  scene.fog = new THREE.Fog(0x9fd3ff, 40, 140);

  // ===== ライト =====
  const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x4a6b2a, 0.9);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
  sun.position.set(30, 50, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const s = sun.shadow.camera;
  s.left = -40; s.right = 40; s.top = 40; s.bottom = -40; s.near = 1; s.far = 150;
  sun.shadow.bias = -0.0005;
  scene.add(sun);
  scene.add(sun.target);

  // ===== 地面 =====
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(WORLD_RADIUS + 40, 64),
    new THREE.MeshStandardMaterial({ color: 0x6fae4b, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // 中央の土の広場
  const plaza = new THREE.Mesh(
    new THREE.CircleGeometry(8, 48),
    new THREE.MeshStandardMaterial({ color: 0xb89b6a, roughness: 1 })
  );
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.01;
  plaza.receiveShadow = true;
  scene.add(plaza);

  // ===== 木と岩（衝突判定用に位置と半径を記録） =====
  const obstacles = [];
  const rand = mulberry32(42);

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a5232, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f8a3a, roughness: 0.8, flatShading: true });
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x8c8c94, roughness: 0.95, flatShading: true });

  for (let i = 0; i < 60; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 14 + rand() * (WORLD_RADIUS - 14);
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    if (rand() < 0.7) {
      const tree = new THREE.Group();
      const h = 2 + rand() * 1.5;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, h, 8), trunkMat);
      trunk.position.y = h / 2;
      const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4 + rand() * 0.6, 0), leafMat);
      leaves.position.y = h + 0.8;
      tree.add(trunk, leaves);
      tree.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
      tree.position.set(x, 0, z);
      scene.add(tree);
      obstacles.push({ x, z, r: 0.6 });
    } else {
      const size = 0.6 + rand() * 1.2;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 0), rockMat);
      rock.position.set(x, size * 0.5, z);
      rock.rotation.set(rand() * 3, rand() * 3, rand() * 3);
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
      obstacles.push({ x, z, r: size * 0.9 });
    }
  }

  return { sun, obstacles };
}

// シード付き乱数（毎回同じ配置にするため）
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

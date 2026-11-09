import * as THREE from 'three';
import { Input } from './input.js';
import { createWorld } from './world.js';
import { Player } from './player.js';
import { ThirdPersonCamera } from './camera.js';

// ===== レンダラー =====
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

// ===== シーンとカメラ =====
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);

const { sun, obstacles } = createWorld(scene);
const input = new Input();
const player = new Player(scene, obstacles);
const followCam = new ThirdPersonCamera(camera, renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===== ゲームループ =====
const timer = new THREE.Timer();
timer.connect(document);
renderer.setAnimationLoop((time) => {
  timer.update(time);
  const dt = Math.min(timer.getDelta(), 0.05);

  player.update(dt, input, followCam.yaw);

  const moving = Math.hypot(player.velocity.x, player.velocity.z) > 0.5;
  followCam.update(dt, player.object.position, input, player.facing, moving);

  // 影がプレイヤー周辺に落ちるよう太陽を追従させる
  const p = player.object.position;
  sun.position.set(p.x + 30, 50, p.z + 20);
  sun.target.position.copy(p);

  renderer.render(scene, camera);
});

// デバッグ用
window.__game = { player, followCam };

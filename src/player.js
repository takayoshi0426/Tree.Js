import * as THREE from 'three';
import { Character } from './character.js';
import { WORLD_RADIUS } from './world.js';

const WALK_SPEED = 4.5;
const RUN_SPEED = 8;
const ACCEL = 30;
const TURN_SPEED = 12;
const GRAVITY = 28;
const JUMP_VELOCITY = 9;
const PLAYER_RADIUS = 0.4;

// 入力とカメラの向きからキャラクターを動かす
export class Player {
  constructor(scene, obstacles) {
    this.character = new Character();
    this.object = this.character.root;
    scene.add(this.object);

    this.obstacles = obstacles;
    this.velocity = new THREE.Vector3();
    this.verticalVelocity = 0;
    this.onGround = true;
    this.facing = 0; // Y軸回転（ラジアン）
  }

  update(dt, input, cameraYaw) {
    // ===== 入力をカメラ基準の方向に変換 =====
    const axis = input.getMoveAxis();
    const running = input.isDown('ShiftLeft', 'ShiftRight');
    const maxSpeed = running ? RUN_SPEED : WALK_SPEED;

    // カメラの前方向 (sin(yaw), cos(yaw)) と右方向
    const fx = Math.sin(cameraYaw), fz = Math.cos(cameraYaw);
    const rx = -fz, rz = fx;
    const dirX = fx * axis.z + rx * axis.x;
    const dirZ = fz * axis.z + rz * axis.x;

    const targetVX = dirX * maxSpeed;
    const targetVZ = dirZ * maxSpeed;
    const k = Math.min(1, ACCEL * dt / maxSpeed);
    this.velocity.x += (targetVX - this.velocity.x) * k;
    this.velocity.z += (targetVZ - this.velocity.z) * k;

    // ===== ジャンプと重力 =====
    if (this.onGround && input.isDown('Space')) {
      this.verticalVelocity = JUMP_VELOCITY;
      this.onGround = false;
    }
    this.verticalVelocity -= GRAVITY * dt;

    // ===== 位置の更新 =====
    const pos = this.object.position;
    pos.x += this.velocity.x * dt;
    pos.z += this.velocity.z * dt;
    pos.y += this.verticalVelocity * dt;
    if (pos.y <= 0) {
      pos.y = 0;
      this.verticalVelocity = 0;
      this.onGround = true;
    }

    this.resolveCollisions(pos);

    // ===== 向きを進行方向へなめらかに回す =====
    const speed = Math.hypot(this.velocity.x, this.velocity.z);
    if (speed > 0.2) {
      const target = Math.atan2(this.velocity.x, this.velocity.z);
      let diff = target - this.facing;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.facing += diff * Math.min(1, TURN_SPEED * dt);
      this.object.rotation.y = this.facing;
    }

    this.character.update(dt, speed / WALK_SPEED, !this.onGround);
  }

  // 木・岩との円同士の押し出しと、フィールドの外周
  resolveCollisions(pos) {
    for (const o of this.obstacles) {
      const dx = pos.x - o.x;
      const dz = pos.z - o.z;
      const minDist = o.r + PLAYER_RADIUS;
      const d = Math.hypot(dx, dz);
      if (d < minDist && d > 1e-4) {
        pos.x = o.x + (dx / d) * minDist;
        pos.z = o.z + (dz / d) * minDist;
      }
    }
    const r = Math.hypot(pos.x, pos.z);
    if (r > WORLD_RADIUS) {
      pos.x *= WORLD_RADIUS / r;
      pos.z *= WORLD_RADIUS / r;
    }
  }
}

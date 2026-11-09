import * as THREE from 'three';

// プレイヤーの後ろを追いかける三人称カメラ（マウスドラッグで回転、ホイールで距離）
export class ThirdPersonCamera {
  constructor(camera, dom) {
    this.camera = camera;
    this.yaw = 0;          // 水平方向の角度（プレイヤーの前方向と同じ定義）
    this.pitch = 0.35;     // 見下ろし角
    this.distance = 7;
    this.currentTarget = new THREE.Vector3();
    this.initialized = false;

    let dragging = false;
    dom.addEventListener('pointerdown', (e) => { dragging = true; dom.setPointerCapture(e.pointerId); });
    dom.addEventListener('pointerup', (e) => { dragging = false; dom.releasePointerCapture(e.pointerId); });
    dom.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      this.yaw -= e.movementX * 0.005;
      this.pitch = THREE.MathUtils.clamp(this.pitch + e.movementY * 0.004, 0.05, 1.2);
    });
    dom.addEventListener('wheel', (e) => {
      this.distance = THREE.MathUtils.clamp(this.distance + e.deltaY * 0.01, 3, 15);
    }, { passive: true });
  }

  update(dt, targetPos, input, playerFacing, playerMoving) {
    // Q/E でもカメラを回せる
    if (input.isDown('KeyQ')) this.yaw += dt * 2;
    if (input.isDown('KeyE')) this.yaw -= dt * 2;

    // 走っている間は少しずつプレイヤーの背後へ回り込む
    if (playerMoving) {
      let diff = playerFacing - this.yaw;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      // 真正面（カメラに向かって走る）ときは回り込まない
      if (Math.abs(diff) < Math.PI * 0.75) this.yaw += diff * Math.min(1, dt * 1.2);
    }

    const lookAt = targetPos.clone().add(new THREE.Vector3(0, 1.4, 0));
    if (!this.initialized) {
      this.currentTarget.copy(lookAt);
      this.initialized = true;
    } else {
      this.currentTarget.lerp(lookAt, Math.min(1, dt * 8));
    }

    const horiz = Math.cos(this.pitch) * this.distance;
    this.camera.position.set(
      this.currentTarget.x - Math.sin(this.yaw) * horiz,
      this.currentTarget.y + Math.sin(this.pitch) * this.distance,
      this.currentTarget.z - Math.cos(this.yaw) * horiz
    );
    this.camera.lookAt(this.currentTarget);
  }
}

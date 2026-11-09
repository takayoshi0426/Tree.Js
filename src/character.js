import * as THREE from 'three';

// プリミティブで組んだオリジナルの仮キャラクター「旅人」
// 後で glTF モデルに差し替えられるよう、見た目とアニメーションだけをここに閉じ込める
export class Character {
  constructor() {
    this.root = new THREE.Group();
    this.walkPhase = 0;

    const skin = mat(0xf2c9a0);
    const tunic = mat(0x2f5d9e);   // 藍色の上着
    const scarf = mat(0xe0702a);   // 橙のマフラー
    const pants = mat(0x4a3b2c);
    const boots = mat(0x2b2018);
    const hair = mat(0x3b2a1e);

    // 体全体（上下に揺らす用）
    this.body = new THREE.Group();
    this.root.add(this.body);

    // 胴体
    const torso = mesh(new THREE.CapsuleGeometry(0.32, 0.45, 6, 12), tunic);
    torso.position.y = 1.15;
    this.body.add(torso);

    // マフラー
    const scarfRing = mesh(new THREE.TorusGeometry(0.26, 0.09, 8, 16), scarf);
    scarfRing.rotation.x = Math.PI / 2;
    scarfRing.position.y = 1.52;
    this.body.add(scarfRing);
    this.scarfTail = mesh(new THREE.BoxGeometry(0.14, 0.4, 0.06), scarf);
    this.scarfTail.geometry.translate(0, -0.2, 0);
    this.scarfTail.position.set(0.12, 1.52, -0.28);
    this.body.add(this.scarfTail);

    // 頭
    this.head = new THREE.Group();
    this.head.position.y = 1.85;
    this.body.add(this.head);
    const face = mesh(new THREE.SphereGeometry(0.3, 20, 16), skin);
    this.head.add(face);
    const hairCap = mesh(new THREE.SphereGeometry(0.32, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
    hairCap.rotation.x = -0.25;
    hairCap.position.set(0, 0.03, -0.03);
    this.head.add(hairCap);
    const eyeMat = mat(0x1a1a1a);
    for (const x of [-0.1, 0.1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeMat);
      eye.position.set(x, 0.02, 0.27);
      this.head.add(eye);
    }

    // 腕（肩を支点に振る）
    this.armL = limb(0.09, 0.45, tunic, skin);
    this.armR = limb(0.09, 0.45, tunic, skin);
    this.armL.position.set(-0.42, 1.42, 0);
    this.armR.position.set(0.42, 1.42, 0);
    this.body.add(this.armL, this.armR);

    // 脚（股関節を支点に振る）
    this.legL = limb(0.12, 0.55, pants, boots);
    this.legR = limb(0.12, 0.55, pants, boots);
    this.legL.position.set(-0.16, 0.78, 0);
    this.legR.position.set(0.16, 0.78, 0);
    this.root.add(this.legL, this.legR);

    this.root.traverse((o) => {
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
  }

  // speedRatio: 0=停止, 1=歩き, 2=ダッシュ。airborne: 空中かどうか
  update(dt, speedRatio, airborne) {
    const t = performance.now() / 1000;

    if (airborne) {
      // ジャンプ中は手足を広げたポーズへ
      this.lerpPose(dt, -0.6, 0.6, -0.5, 0.3);
      this.body.position.y = 0;
      this.scarfTail.rotation.x = THREE.MathUtils.lerp(this.scarfTail.rotation.x, -1.2, dt * 8);
      return;
    }

    if (speedRatio > 0.05) {
      this.walkPhase += dt * (6 + speedRatio * 4);
      const swing = Math.sin(this.walkPhase) * (0.5 + speedRatio * 0.25);
      this.armL.rotation.x = swing;
      this.armR.rotation.x = -swing;
      this.legL.rotation.x = -swing;
      this.legR.rotation.x = swing;
      this.body.position.y = Math.abs(Math.sin(this.walkPhase)) * 0.06 * speedRatio;
      this.body.rotation.x = 0.06 * speedRatio; // 少し前傾
      this.scarfTail.rotation.x = -0.4 * speedRatio + Math.sin(this.walkPhase * 2) * 0.1;
    } else {
      // 待機：呼吸のような揺れ
      this.lerpPose(dt, 0, 0, 0, 0);
      this.body.position.y = Math.sin(t * 2) * 0.015;
      this.body.rotation.x = THREE.MathUtils.lerp(this.body.rotation.x, 0, dt * 8);
      this.scarfTail.rotation.x = THREE.MathUtils.lerp(this.scarfTail.rotation.x, Math.sin(t * 1.5) * 0.08, dt * 4);
    }
  }

  lerpPose(dt, armL, armR, legL, legR) {
    const k = Math.min(1, dt * 10);
    this.armL.rotation.x += (armL - this.armL.rotation.x) * k;
    this.armR.rotation.x += (armR - this.armR.rotation.x) * k;
    this.legL.rotation.x += (legL - this.legL.rotation.x) * k;
    this.legR.rotation.x += (legR - this.legR.rotation.x) * k;
  }
}

function mat(color) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
}

function mesh(geo, material) {
  return new THREE.Mesh(geo, material);
}

// 支点（上端）から下に伸びる手足。先端は別の色（手・ブーツ）
function limb(radius, length, upperMat, tipMat) {
  const pivot = new THREE.Group();
  const upper = mesh(new THREE.CapsuleGeometry(radius, length - radius * 2, 4, 8), upperMat);
  upper.position.y = -length / 2;
  pivot.add(upper);
  const tip = mesh(new THREE.SphereGeometry(radius * 1.15, 10, 8), tipMat);
  tip.position.y = -length;
  pivot.add(tip);
  return pivot;
}

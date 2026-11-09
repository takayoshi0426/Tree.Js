// キーボード入力の状態を保持するクラス
export class Input {
  constructor() {
    this.keys = new Set();
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  isDown(...codes) {
    return codes.some((c) => this.keys.has(c));
  }

  // 前後左右の入力を -1〜1 の値で返す（x: 右が+、z: 前が+）
  getMoveAxis() {
    let x = 0;
    let z = 0;
    if (this.isDown('KeyW', 'ArrowUp')) z += 1;
    if (this.isDown('KeyS', 'ArrowDown')) z -= 1;
    if (this.isDown('KeyD', 'ArrowRight')) x += 1;
    if (this.isDown('KeyA', 'ArrowLeft')) x -= 1;
    const len = Math.hypot(x, z);
    return len > 0 ? { x: x / len, z: z / len } : { x: 0, z: 0 };
  }
}

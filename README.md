# Tree.js

ブラウザで動く 3D アクションアドベンチャーの試作（Vite + Three.js）。

## 起動

```bash
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開きます。

## 操作

| 操作 | キー |
| --- | --- |
| 移動 | WASD / 矢印キー（カメラの向き基準） |
| ダッシュ | Shift |
| ジャンプ | Space |
| カメラ回転 | マウスドラッグ / Q・E |
| ズーム | マウスホイール |

## ファイル構成

- `src/main.js` レンダラー・ゲームループ
- `src/world.js` 空・光・地面・木や岩
- `src/character.js` 仮キャラクター「旅人」の見た目と歩きアニメーション
- `src/player.js` 移動・ジャンプ・当たり判定
- `src/camera.js` 三人称追従カメラ
- `src/input.js` キーボード入力

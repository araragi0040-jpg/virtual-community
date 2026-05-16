# 語り場4U 仮想コミュニティ v001

梅田風の小さなマップを歩き、語り場4U・くさのね劇場・ブランチカフェに入れる仮デモです。

## 起動方法

ローカルで確認する場合は、`index.html` を直接開くのではなく、簡易サーバーで起動してください。

```bash
cd virtual-community-4u
python -m http.server 8000
```

ブラウザで以下を開きます。

```text
http://localhost:8000
```

## 操作

- 移動：画面下の十字キー / キーボード矢印 / WASD
- 調べる：画面下の「調べる」 / Enter / Space / マップクリック
- 右端・下端・上端・左端を超えるとマップ移動します
- 扉前で調べると入店確認が出ます

## 主なファイル

```text
index.html
style.css
script.js
assets/maps/          背景マップ画像
assets/characters/    プレイヤー・NPC画像
data/maps.json        マップ・座標・判定エリア
data/npcs.json        NPC座標・会話ID
data/dialogues.json   会話・看板・入店確認
data/boards.json      掲示板テキスト・URL
data/menus.json       メニューテキスト
```

## v001の目的

画像・座標はすべて仮です。まずは以下の体験確認を優先しています。

1. 歩き回れる
2. 店舗間を移動できる
3. 店に入れる
4. NPCと話せる
5. メニュー・掲示板を表示できる
6. 外部URLへ遷移できる

## 次に調整する候補

- 画像内に描かれているNPCと個別NPC素材の重なり調整
- 扉・掲示板・看板の座標微調整
- 通行可能範囲の制限
- 看板や掲示板の個別PNG化
- スマホでの移動速度・操作感調整

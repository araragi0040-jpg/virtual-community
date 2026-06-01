# 歩ける語り場 v027

v027では、v026の **全対象共通エディタ** を維持したまま、次のスプシ移行に備えて **データ正規化・全体チェック・バックアップ/復元** を追加しました。

## 起動方法

```bash
cd virtual-community-4u-v027
python -m http.server 8000
```

ゲーム画面：

```text
http://localhost:8000
```

配置エディタ：

```text
http://localhost:8000/editor.html
```

## v027で追加したこと

- データ正規化ボタンを追加
  - 旧形式の `choices` / `option1` 系を `options` 形式へ統一
  - `visibleDays` / `visibleWhen` / `note` などの共通項目を補完
  - NPC、掲示板、メニュー、隠し要素、扉、看板、イベント、ブロックを同じ思想で管理しやすく整理

- 全体チェックボタンを追加
  - ID重複チェック
  - 存在しない `targetId` / `boardId` / `menuId` / `dialogueId` / `linkBoardId` / `targetMapId` の検出
  - 有効リンクなのにURLが空の項目を警告
  - 本文・画像・範囲などの簡易チェック

- 全データバックアップを追加
  - `mapsData` / `npcsData` / `dialoguesData` / `boardsData` / `menusData` / `hiddenData` / `linkBoardsData` / `actionsData` / `achievementsData` をまとめて1つのJSONで保存

- バックアップ復元を追加
  - 書き出したバックアップJSONからエディタ状態を復元
  - 復元後は「下書き保存」または各JSON保存で反映

- 全JSONまとめ保存を追加
  - スプシ移行前の確認用として、現在の全データを1ファイルに出力

## 確認手順

1. `editor.html` を開く
2. 「データ正規化」を押す
3. 「全体チェック」を押す
4. エラーや警告を確認する
5. 必要に応じて編集する
6. 「全データバックアップ」を押して保存する
7. 復元確認をする場合は「バックアップ復元」から保存したJSONを選ぶ

## 注意

- 正規化は、今後のスプシ移行に向けたデータ整理です。
- 入店確認データは、扉オブジェクト側の `targetMapId` を利用するため、既存の `options` がある場合のみ正規化します。
- 全体チェックの「警告」は必ずしもエラーではありません。準備中URLなどは警告として表示されます。

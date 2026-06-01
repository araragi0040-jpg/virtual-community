# 歩ける語り場 v028

v028では、v027の **データ正規化・バックアップ** を維持したまま、次のスプレッドシート移行に備えて **CSV/TSV出力** を追加しました。

## 起動方法

```bash
cd virtual-community-4u-v028
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

## v028で追加したこと

- 配置エディタからスプシ貼り付け用TSVを一括出力
- 配置エディタからCSVを一括出力
- シート出力プレビューを追加
- JSON内の配列・条件・選択肢をシート用に展開
- `data/sheet_exports/v028/` に現在データから生成したTSV/CSVサンプルを同梱
- `docs/spreadsheet_export_v028.md` を追加

## 推奨手順

1. `editor.html` を開く
2. 「データ正規化」を押す
3. 「全体チェック」を押す
4. 問題がなければ「スプシ用TSV一括DL」または「CSV一括DL」を押す
5. Googleスプレッドシートにシート名を作成し、該当TSV/CSVを貼り付ける

## 生成される主なシート

- maps
- interactables
- blocks
- npcs
- hidden_spots
- dialogues
- confirms
- boards
- menus
- actions
- achievements
- link_boards
- link_items
- options

## 補足

v028はまだ「スプシへ自動保存」ではありません。
まずは、JSON管理の内容をスプシに移しやすい形で出力する段階です。

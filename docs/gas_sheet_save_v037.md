# v037 GASシート保存

## 概要

v037では、エディタで編集した内容を、GAS経由でGoogleスプレッドシートの各シートへ保存できるようにしました。

## 追加API

### POST `mode=saveSheets`

送信内容：

```json
{
  "mode": "saveSheets",
  "label": "before-sheet-save-2026-06-02T...",
  "source": "editor-v037",
  "summary": {},
  "sheetSummary": {},
  "sheets": {
    "maps": { "headers": [], "rows": [] },
    "interactables": { "headers": [], "rows": [] }
  }
}
```

## 保存前バックアップ

保存前に、現在スプシ上にあるデータを読み込み、`backups` シートへ丸ごと保存します。

現在のスプシが空、または `maps` が0件の場合は、バックアップ警告付きで保存を続行します。

## 上書き対象シート

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

## 注意

- `backups` シートは上書き対象外です。
- シート名は `01_maps` のような番号付きでも読込・保存対象になります。
- ただし、新規作成時は番号なしの `maps` 形式で作成されます。

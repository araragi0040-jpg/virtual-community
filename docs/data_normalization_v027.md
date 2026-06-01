# v027 データ正規化・バックアップ方針

## 目的

v026までで増えた各種JSONを、今後のスプレッドシート管理・GAS連携に移行しやすい形へ整える。

## 共通化する項目

多くの対象に、以下の項目を持たせる方針とする。

| 項目 | 内容 |
|---|---|
| id | 一意のID |
| label / title / name | 表示名 |
| visibleDays | 表示曜日。未指定は `['all']` |
| visibleWhen | 表示条件 |
| options | 選択肢配列 |
| note | 管理用メモ |

## 選択肢形式

旧形式の `choices` や `option1/option2/option3` は、基本的に `options` へ寄せる。

```json
{
  "label": "掲示板を見る",
  "type": "board",
  "targetId": "board_4u",
  "visibleDays": ["fri"],
  "visibleWhen": { "type": "statAtLeast", "stat": "talk", "value": 3 }
}
```

## バックアップ

エディタ上の「全データバックアップ」では、以下を1ファイルにまとめる。

- mapsData
- npcsData
- hiddenData
- dialoguesData
- boardsData
- menusData
- linkBoardsData
- actionsData
- achievementsData

## チェック項目

- ID重複
- 参照先IDの存在
- 有効リンクのURL空欄
- マップ画像パスの空欄
- NPCの会話ID参照切れ
- 掲示板・メニュー・リンク集の参照切れ

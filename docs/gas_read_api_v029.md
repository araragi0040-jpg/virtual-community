# v029 GAS読み込みAPI セットアップ

v029では、Googleスプレッドシートに保存した各シートをGASで読み込み、アプリ側へJSONとして返す読み込み専用APIを追加しています。

## 1. スプレッドシートを作成

v028で出力したTSV/CSVを使い、以下のシート名でスプレッドシートを作成します。

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

各シートの1行目はヘッダー行にしてください。

## 2. Apps Scriptを作成

1. スプレッドシートを開く
2. 拡張機能 → Apps Script
3. `gas/Code.gs` の内容を貼り付ける
4. スプレッドシートに紐づいたApps Scriptの場合、`SPREADSHEET_ID` は空のままでOK
5. 別プロジェクトで使う場合は、`SPREADSHEET_ID` にスプレッドシートIDを入力

## 3. Webアプリとしてデプロイ

1. Apps Script右上の「デプロイ」
2. 「新しいデプロイ」
3. 種類：ウェブアプリ
4. 実行ユーザー：自分
5. アクセスできるユーザー：全員、またはリンクを知っている全員
6. デプロイしてWebアプリURLをコピー

## 4. アプリ側にURLを設定

ゲーム画面を開きます。

1. メニュー
2. データ設定
3. GAS URLを設定
4. WebアプリURLを貼り付ける
5. GASで読み込む
6. 再読み込み

画面上部に `データ GAS` と表示されれば、GAS APIから読み込めています。

## 5. URLパラメータで指定する場合

以下のようにURLパラメータでも指定できます。

```text
index.html?source=gas&api=GAS_WEB_APP_URL
```

ローカルJSONに戻したい場合：

```text
index.html?source=local
```

## 6. 動作確認用

GAS WebアプリURLの末尾に以下を付けると、疎通確認できます。

```text
?mode=ping
```

`ok: true` が返ればGAS側は動作しています。

## 7. v029の範囲

v029は読み込み専用です。

- スプシ → GAS → アプリ読み込み：対応
- アプリ/エディタ → GAS → スプシ保存：未対応

保存対応は次フェーズで実装します。

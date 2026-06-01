# 歩ける語り場 v029

v029では、v028の **スプシ移行用CSV/TSV出力** を維持したまま、次段階として **Googleスプレッドシート → GAS → アプリ読み込み** の読み込み専用APIに対応しました。

## 起動方法

```bash
cd virtual-community-4u-v029
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

## v029で追加したこと

- `gas/Code.gs` を追加
- GAS WebアプリURLを設定できる「データ設定」ボタンを追加
- ローカルJSON / GAS API の読み込み切替に対応
- 画面上部にデータ取得元バッジを追加
  - `データ Local`
  - `データ GAS`
- GAS読み込み失敗時はローカルJSONへフォールバック
- `docs/gas_read_api_v029.md` を追加

## GAS読み込みの確認手順

1. v028/v029で出力したTSVをGoogleスプレッドシートに貼り付ける
2. Apps Scriptに `gas/Code.gs` を貼り付ける
3. Webアプリとしてデプロイ
4. ゲーム画面の「メニュー」→「データ設定」
5. GAS URLを登録
6. 「GASで読み込む」→「再読み込み」
7. 画面上部に `データ GAS` と出るか確認

詳しい手順は以下を参照してください。

```text
docs/gas_read_api_v029.md
```

## URLパラメータでも指定可能

```text
index.html?source=gas&api=GAS_WEB_APP_URL
```

ローカルJSONで起動：

```text
index.html?source=local
```

## v029の範囲

v029は **読み込み専用** です。

まだスプレッドシートへの保存は行いません。
次は、GASから読み込んだデータで表示・移動・会話・掲示板が崩れないかを確認します。

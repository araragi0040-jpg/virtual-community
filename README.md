# 歩ける語り場 v014

語り場4Uを中心に、くさのね劇場・ブランチカフェへ移動できる仮想コミュニティMAPです。

v014では、v012のゲーム本体を維持しつつ、次段階に向けた **配置エディタ** と **スプレッドシート移行準備データ** を追加しました。

## v014で追加したこと

- `editor.html` を追加
  - マップ上でNPC・入口・掲示板・看板・隠し要素の座標をドラッグ調整できます。
  - 変更後の `maps.json` / `npcs.json` / `hidden.json` を保存できます。
- 上部メニューに「編集」ボタンを追加
  - ゲーム画面から配置エディタへ移動できます。
- `data/schema.json` を追加
  - 将来的なスプレッドシート移行用のデータ構造メモです。
- `data/sheet_templates/` を追加
  - 現在のJSONをGoogleスプレッドシートへ移しやすいCSVテンプレートに変換しています。
- `docs/spreadsheet_migration_plan.md` を追加
  - 今後のスプシ/GAS連携方針をまとめています。

## 起動方法

`index.html` を直接開くとJSON読み込みが止まることがあるため、簡易サーバーで起動してください。

```bash
cd virtual-community-4u-v014
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

## 配置エディタの使い方

1. マップを選択
2. レイヤーを選択
   - 入口・掲示板・看板・メニュー
   - NPC
   - 隠し要素
3. マップ上の枠や点をクリック/タップ
4. ドラッグして座標を調整
5. 必要に応じて右側フォームで数値を微調整
6. `maps.json保存` などでファイル出力
7. 出力したJSONを `data/` に差し替える

## スプレッドシート移行について

`data/sheet_templates/` 内のCSVは、Googleスプレッドシートに取り込むための下準備です。

今後の流れは以下です。

```text
JSONでUI・体験を固める
↓
CSVテンプレートでデータ項目を整理
↓
Googleスプレッドシートへ移行
↓
GAS APIでアプリに読み込む
↓
配置エディタからスプシへ保存できるようにする
```

## 主なファイル

```text
index.html          ゲーム本体
script.js           ゲーム本体ロジック
style.css           ゲーム本体UI
editor.html         配置エディタ
editor.js           配置エディタロジック
editor.css          配置エディタUI
data/*.json         ゲーム用データ
data/sheet_templates/*.csv  スプシ移行用CSV
docs/spreadsheet_migration_plan.md  スプシ移行方針
```


## v014 追加内容

- 配置エディタで四角い判定範囲の角・辺をクリック＆ドラッグしてサイズ変更できるようにしました。
- 枠内ドラッグは移動、白いハンドルのドラッグはリサイズとして動作します。

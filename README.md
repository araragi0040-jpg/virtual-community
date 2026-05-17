# 歩ける語り場 v012

語り場4Uを中心に、くさのね劇場・ブランチカフェへ移動できる仮想コミュニティMAPです。

v012では、v011の安定版をベースに「掲示板・リンク集の導線サンプル」を追加しました。

## 追加内容

- 上部メニューに「リンク」ボタンを追加
- `data/linkBoards.json` を追加
- 街の掲示板から、店舗リンク・ニュース・人物活動リンクへ分岐できる形を追加
- 準備中リンクはアプリ内で「準備中」と表示
- 外部リンクを開いた回数を体験メモに記録
- 掲示板閲覧・リンク閲覧に関する実績を追加

## 編集する場所

### リンク集を編集したい場合

`data/linkBoards.json` を編集します。

```json
{
  "label": "表示名",
  "url": "https://example.com/",
  "note": "説明文",
  "enabled": true
}
```

未確定リンクは下記のようにしておくと、アプリ内では準備中として表示されます。

```json
{
  "label": "コミュニティニュース",
  "url": "",
  "note": "あとでニュースサイトURLを入れる",
  "enabled": false
}
```

### 掲示板からリンク集へ飛ばしたい場合

`data/boards.json` の対象掲示板に `linkBoardId` を設定します。

```json
"linkBoardId": "community_hub"
```

## 起動方法

```bash
cd virtual-community-4u-v012
python -m http.server 8000
```

ブラウザで開きます。

```text
http://localhost:8000
```

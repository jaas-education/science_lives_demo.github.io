# Science Lives

静的HTML/CSS/JavaScript + JSONで動くクイズゲームです。

## 起動方法
`fetch()` でJSONを読むため、HTMLファイルを直接ダブルクリックするのではなく、簡易Webサーバーで開いてください。

例（Python 3）:

```bash
cd science-lives
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000/` を開きます。

## 難易度・ジャンルの追加／削除／名称変更
`data/categories.json` だけを編集します。HTMLやJavaScriptの修正は不要です。

初期データには難易度 `extra`（表示名 `Extra`）とジャンル `シチズンサイエンス` も登録済みです。

### 難易度
`difficulties` 配列に項目を追加します。

```json
{
  "id": "4",
  "name": "研究仙人",
  "description": "難易度 4",
  "certificate": {
    "title": "研究仙人 認定証",
    "message": "Science Lives「研究仙人」を全問正解しました。\n卓越した理解をここに称えます。"
  }
}
```

問題側の `difficulty` に同じ `id` を指定してください。

### ジャンル
`genres` 配列に項目を追加します。

```json
{
  "id": "研究生活",
  "name": "研究生活",
  "description": "ジャンル",
  "certificate": {
    "title": "研究生活 マスター認定証",
    "message": "Science Lives「研究生活」を全問正解しました。\n研究の日常への理解をここに称えます。"
  }
}
```

問題側の `genre` に同じ `id` を指定してください。

- `id`: questions.json と紐づける値。変更する場合は問題データ側も変更してください。
- `name`: ゲーム画面や進捗表示に出す名称。表示名だけ変えたい場合はここだけ変更できます。
- `description`: 選択カード下部の説明。
- `certificate`: 任意。省略すると名称から標準の認定証を自動生成します。

項目を削除すると選択画面からも自動的に消えます。並び順は `categories.json` の配列順です。

## 問題の追加
`data/questions.json` を編集します。

主要フィールド:
- `heading`: 見出し
- `difficulty`: `data/categories.json` の難易度 `id`
- `genre`: `data/categories.json` のジャンル `id`
- `question`: 問題文
- `choices`: 3択
- `answerIndex`: 正解の配列番号（0,1,2）
- `hint`: ヒント
- `explanation`: 解説
- `episode`: 任意。なければ回答後に表示されません

5問モードでは選択カテゴリに5問以上、10問モードでは10問以上必要です。

## サイト本文の編集
`data/site.json` を編集します。About・遊び方・ニュース・寄付ページの内容もここで管理します。

遊び方・寄付などの本文で任意の位置に改行を入れたい場合は、JSON文字列内に `\n` を入れてください。画面ではその位置で改行されます。

例: `"body": "1行目\n2行目"`

Aboutの「本ゲームへのご支援」も `data/site.json` から編集できます。現在は `〇〇財団` を仮置きしているので、正式名称に置き換えてください。

## 賞状の編集
難易度・ジャンルごとの賞状は `data/categories.json` の各 `certificate` で編集します。
`message` 内に `\n` を入れると、その位置で改行されます。

旧 `data/certificates.json` は互換性のため残していますが、ゲームからは参照しません。

## ページ構成
- `index.html`: トップ
- `game.html`: クイズ
- `about.html`: About
- `howto.html`: 遊び方
- `news.html`: ニュース
- `donation.html`: 寄付

## JSON本文にWebリンクを入れる

`data/site.json` の `body` など、説明文として表示される文章では、Markdown風の次の書式でリンクを設定できます。

```text
[表示する文字](https://example.com/)
```

例：

```json
"body": "本ゲームの開発は[〇〇財団](https://example.com/)からの支援を受けています。\n詳しくはリンク先をご覧ください。"
```

`https://` / `http://` の外部リンクは新しいタブで開きます。`mailto:`、`/`、`./`、`../`、`#` から始まるリンクも利用できます。

改行はこれまでどおり `\n` を使えます。リンクと改行は同じ文章内で併用できます。

このリンク記法は `About`、`遊び方`、`ニュース`、`寄付` の本文で共通して利用できます。

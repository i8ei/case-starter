# case-starter

現実の案件を、AIエージェントと人間が一緒に扱える形にするためのテンプレートです。

案件ごとに違うのは具材で、進め方の骨格はかなり共通しています。  
Git を正本にし、AI が読める構造で保持し、人間には HTML で状態を見せます。

## 何を管理するか

- `case.json`: 現在地、blocker、次アクション、クリティカルパス
- `stakeholders.json`: 関係者、重要度、連絡先、状況
- `questions.json`: 未確定事項、owner、優先度、解決状況
- `tasks.json`: 次アクション、依存関係、期限、担当
- `decisions.json`: 確定した判断と理由
- `logs/`: 面談、電話、メール、会議の一次記録
- `docs/`: 案件の説明資料
- `public/index.html`: ダッシュボード出力

## クイックスタート

1. このリポジトリを複製して案件ごとの repo にする
2. 案件名を入れて初期化する

```bash
npm run init -- --title "案件名" --id case-slug
```

3. JSON と docs を案件内容で埋める
4. ダッシュボードを生成する

```bash
npm run build
```

5. 構造チェックとダッシュボード再生成をまとめて行う

```bash
npm run check
```

## 最小構成

```text
case-starter/
  README.md
  package.json
  case.json
  phases.json
  stakeholders.json
  questions.json
  tasks.json
  decisions.json
  logs/
  docs/
  public/
  scripts/
```

## 運用ルール

1. `questions` に「分からない」を問いとして分解する
2. `tasks` には行動だけを書く。依存関係は `depends_on` で持つ
3. 連絡や会話はまず `logs/` に残し、その結果を JSON に反映する
4. 判断が確定したら `decisions.json` に理由つきで残す
5. 変更後は `npm run check` を回してからコミットする

## バリデーションで見ていること

- 必須項目の欠落
- 日付形式の崩れ
- `phase` が `phases.json` に存在するか
- `tasks.depends_on` が存在する task を参照しているか
- `decisions.from_question` が存在する question を参照しているか
- `critical_path_current_index` が範囲内か

フィールドの意味は [docs/data-model.md](/Users/issei/Documents/case-starter/docs/data-model.md) にまとめています。

## このテンプレートの前提

ルールやスキームがまだ固まっていない案件を前提にしています。  
つまり、最初に管理すべきものは「完了済みの知識」より `未解決の問い` と `次の行動` です。

ルートの JSON や docs はそのまま使えるサンプルです。  
`npm run init` を使うと、案件名と日付を初期値に反映できます。

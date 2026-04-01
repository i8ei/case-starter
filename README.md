# case-starter

![case-starter overview](docs/assets/case-starter-overview.png)

会議メモ、メール、相談記録が散らばって、毎回「今どうなっているんだっけ」となる案件があります。  
`case-starter` は、そういう曖昧で流動的な案件の現在地を、AI と人間が同じ認識で追えるようにするためのテンプレートです。

Git を正本にして、案件の現在地を JSON で持ち、一次記録を `logs/` に残します。そこから `未解決の問い`、`次の行動`、`確定した判断` を分けて管理し、人間向けには HTML ダッシュボードでも見えるようにします。

- Dashboard preview: https://i8ei.github.io/case-starter/
- AI session rules: [CLAUDE.md](CLAUDE.md)
- License: [MIT](LICENSE)

## これは何か

`case-starter` は、曖昧で流動的な案件を「AIが読める構造」と「人間が追える運用」に分解するための最小セットです。

向いている案件:

- 行政照会、専門家相談、合意形成が絡む
- 前提事実や制度解釈がまだ固まっていない
- 「何が未確定か」と「次に何をやるか」を常に明確にしたい
- 会話、電話、メール、会議メモが散らばりやすい

このテンプレートでは、完了済みの知識を並べるより先に、`未解決の問い`、`次の行動`、`確定した判断` を分けて持ちます。

## 管理するもの

- `case.json`: 案件全体の現在地。phase、blocker、next action、critical path を持つ
- `stakeholders.json`: 関係者、重要度、状況、連絡先を持つ
- `questions.json`: 未確定事項を問いとして分解して持つ
- `tasks.json`: 次アクション、依存関係、期限、担当を持つ
- `decisions.json`: 確定した判断と理由を持つ
- `logs/`: 面談、電話、メール、会議の一次記録を置く
- `docs/`: 案件概要や補助資料を置く
- `public/index.html`: ダッシュボード出力

フィールド定義は [docs/data-model.md](docs/data-model.md) を参照してください。

## クイックスタート

1. このリポジトリを複製して案件ごとの repo にする
2. 案件名を入れて初期化する

```bash
npm run init -- --title "案件名" --id case-slug
```

3. `case.json` と各 JSON を案件内容で埋める
4. ダッシュボードを生成する

```bash
npm run build
```

5. 構造チェックとダッシュボード再生成をまとめて行う

```bash
npm run check
```

新しい素材を入れるときは、先にログの雛形を作る。

```bash
npm run new-log -- --title "関係者Aとの電話" --type call --slug agency-call
```

## Preview

この repo には、生成済みのダッシュボードをそのまま含めています。

- GitHub Pages: https://i8ei.github.io/case-starter/
- Repository preview file: [public/index.html](public/index.html)

ローカルで確認する場合は `npm run build` のあとに `public/index.html` を開けばよいです。

## 典型的な運用フロー

1. 連絡や会話が発生したら、まず `logs/` に一次記録を残す
2. `questions.json` に「分からないこと」を問いとして切る
3. `tasks.json` に「今やる行動」を書く
4. 記録をもとに `questions`、`tasks`、`decisions`、`case` を更新する
5. `npm run check` で整合性を確認し、ダッシュボードを再生成する
6. Git にコミットして状態を固定する

## コマンド

- `npm run init -- --title "案件名" --id case-slug`
  新しい案件名でテンプレート初期値を更新する
- `npm run validate`
  JSON 構造と参照整合性を検証する
- `npm run build`
  `public/index.html` を再生成する
- `npm run check`
  `validate` と `build` をまとめて実行する
- `npm run new-log -- --title "記録タイトル"`
  `logs/` に標準的な記録テンプレートを生成する

## 何を検証するか

- 必須項目が埋まっているか
- 日付が `YYYY-MM-DD` 形式か
- `case.json.phase` が `phases.json` に存在するか
- `tasks.depends_on` が存在する task を参照しているか
- `decisions.from_question` が存在する question を参照しているか
- `critical_path_current_index` が範囲内か
- `case.json.current_blockers` / `next_actions` / `primary_blocker` に書いた `T-*` `Q-*` 参照が、現在の task / question 状態と食い違っていないか

## リポジトリ構成

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

## 公開運用メモ

- サンプル JSON と docs は、そのまま試せる最小構成を意図している
- `public/index.html` は生成物だが、初見でもすぐ見られるように commit する前提
- 外部ノートを併用する場合でも、この repo 内の JSON を現在地の正本にする

## 運用上の原則

1. `questions` には論点を書く。感想や議事録を直接入れない
2. `tasks` には行動を書く。依存関係は `depends_on` で持つ
3. `decisions` には結論だけでなく理由も残す
4. `logs` は加工前の一次記録として扱う
5. ダッシュボードは編集せず、必ず JSON から再生成する
6. `questions / tasks / decisions` は、可能な限り `source_log` を持たせる
7. 外部ノートを併用する場合でも、案件の正本は repo 内の JSON に置く

## 外部ノート併用

Obsidian などの外部ノートを併用してもよいですが、役割を分けた方が運用が安定します。

- repo 内 JSON: 現在地の正本
- `logs/`: 一次記録の正本
- 外部ノート: 時系列の補助メモ、検討メモ、説明文の叩き台

外部ノートは、古いメモを毎回全面更新するより、日付付きで追記していく時系列ログとして使う方が安全です。
再開時に迷わないよう、外部ノート側にも「読む入口」を1枚置いておく運用を推奨します。

## AI セッション運用

このテンプレートの差別化ポイントのひとつは、AI セッションの運用手順まで repo に含めていることです。

AI セッション開始時の読み順や更新ルールは [CLAUDE.md](CLAUDE.md) にまとめています。
入力素材から更新差分を作る流れは [docs/update-workflow.md](docs/update-workflow.md) にまとめています。

想定している基本の流れ:

1. `case.json` と `tasks.json` で現在地を把握する
2. `questions.json` と `decisions.json` で未解決論点と既決事項を把握する
3. 新しい連絡や会話が来たら `logs/` に落とす
4. JSON を更新し、`npm run check` を回す

## 前提

このテンプレートは、手続きやスキームがまだ固まっていない案件を前提にしています。  
つまり、最初に管理すべきなのは「完成した説明資料」ではなく、`今どこで止まっているか` と `次に何をやるか` です。

ルートの JSON と docs は、そのまま編集して使えるサンプルになっています。

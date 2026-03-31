# case-starter — AI セッションガイド

## セッション開始時にやること

1. `case.json` を読んで現在の status / phase / blockers / next_actions を把握する
2. `tasks.json` を読んで next / in_progress のタスクを把握する
3. `questions.json` と `decisions.json` を読んで、未解決論点と確定済み判断を把握する
4. 関係者からの未読メールを確認する（gws CLI が使える場合）：
   ```bash
   gws gmail users messages list --params '{"userId":"me","labelIds":["INBOX","UNREAD"],"maxResults":10}'
   ```
5. 「現在地」を1〜2文で要約してユーザーに伝える

## ユーザーが報告・連絡内容を伝えてきたら

1. 内容をもとに該当 JSON を更新する
   - `tasks.json`：status の更新（next → in_progress → done）
   - `questions.json`：status の更新（open/pending → resolved）+ resolution を追記
   - `case.json`：blockers / next_actions / critical_path_current_index を最新化
   - `decisions.json`：確定した方針があれば追加（from_question も記録する）
   - `source_log` / `updated_at` がある項目はなるべく埋める
2. `logs/YYYY-MM-DD-XXX.md` に会話・メール・電話の記録を作成する
3. `npm run check` で構造チェックとダッシュボード再生成を行う
4. `git add -A && git commit -m "update: ..."` でコミットする
5. 変更サマリーをユーザーに報告する

## 更新契約

素材として入ってくるのは、会話メモ、音声文字起こし、構造化議事録、メール本文、電話記録である。
AI はそれをそのまま要約するのではなく、必ず `logs` と state に分けて反映する。

更新順序は必ず以下に従う。

1. まず `logs/YYYY-MM-DD-XXX.md` に一次記録を残す
2. その記録を根拠に `questions / tasks / decisions / case` を更新する
3. 最後に `npm run check` を実行する

## どこに何を書くか

- `logs`
  会話、電話、メール、会議の一次記録を残す場所。解釈前の事実を置く
- `questions.json`
  まだ確定していない論点だけを書く。未確定事項、照会事項、確認待ちを入れる
- `tasks.json`
  誰かが次にやる具体的行動だけを書く。説明文や論点整理を書かない
- `decisions.json`
  結論と理由が揃ったものだけを書く。仮説や見込みは入れない
- `case.json`
  案件全体の圧縮された現在地だけを書く。詳細は他 JSON に逃がす

## 判定ルール

- 未確定のものは `decision` に入れない
- 「確認する」「待つ」「依頼する」「作成する」など行動に落ちるものだけ `task` に入れる
- 既に終わった行動は新しい `task` を増やさず、既存 task を `done` に更新することを優先する
- 1つの素材から複数の変化が出てもよいが、同じ事実を `question` と `decision` に二重計上しない
- `case.summary` は毎回全文書き換えなくてよい。`current_blockers`、`next_actions`、`updated_at` の整合を優先する
- 新しい判断を `decisions` に追加したら、必要に応じて対応する `question` を `resolved` に更新する

## 更新前に考えること

素材を受け取ったら、いきなり JSON を書き換えず、頭の中で必ず次の区分に分ける。

- New questions
- Resolved questions
- New tasks
- Updated tasks
- New decisions
- Case updates
- No change

この区分で差分が説明できない場合は、JSON を更新しない。

## 特に避けること

- 曖昧な見込みを `decision` として確定扱いする
- 会議メモの文章をそのまま `task` に入れる
- `logs` だけ追加して state を更新しない
- `case.json` だけ更新して `questions / tasks / decisions` と不整合にする
- 既存 task や question を読まずに、似た内容を重複追加する

## ユーザーが文書・メールの作成を頼んできたら

tasks.json / questions.json / decisions.json の内容を参照して作成する。
作成した文書はそのまま返す（ファイル保存は不要）。

## フェーズ遷移

phases.json に有効なフェーズと遷移先が定義されている。
案件が前進したら case.json の phase と critical_path_current_index を更新する。

## 使ってよいコマンド

- `npm run validate`
- `npm run build`
- `npm run check`
- `npm run init -- --title "案件名" --id case-slug`

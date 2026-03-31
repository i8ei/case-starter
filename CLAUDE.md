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

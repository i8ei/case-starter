# Update Workflow

このテンプレートでは、人が JSON を直接編集する前に、まず素材を `logs/` に落とす。

## 入力源

- 会議メモ
- 音声文字起こし
- 構造化議事録
- メール本文
- 電話記録

## 基本手順

1. `npm run new-log -- --title "記録タイトル"` でログの雛形を作る
2. `Raw notes` に素材を貼る
3. `Candidate updates` に差分案を整理する
4. その差分をもとに `questions / tasks / decisions / case` を更新する
5. `npm run check` を回す

## Candidate updates の考え方

素材を受け取ったら、必ず以下の区分で差分を考える。

- New questions
- Resolved questions
- New tasks
- Updated tasks
- New decisions
- Case updates
- No change

この区分に落とせない場合は、state を更新しない。

## source_log の扱い

- `questions.json`
  その問いがどの記録から生まれたかを `source_log` に書く
- `tasks.json`
  その行動がどの記録から発生したかを `source_log` に書く
- `decisions.json`
  その判断の根拠になった記録を `source_log` に書く

`source_log` は `logs/2026-04-01-example.md` のような相対パスで持つ。

## 更新の優先順位

1. `logs`
2. `questions`
3. `tasks`
4. `decisions`
5. `case`

`case.json` は最後に整える。先に `case` だけ書き換えない。

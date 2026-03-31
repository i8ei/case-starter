# Data Model

## case.json

- `id`: 案件ID
- `title`: 案件名
- `status`: 現在の状態ラベル
- `phase`: `phases.json` で定義されたフェーズID
- `summary`: 案件要約
- `current_blockers`: 現在止まっている理由
- `next_actions`: 今日または直近でやること
- `critical_path`: 案件の主要な道筋
- `critical_path_current_index`: 現在位置
- `updated_at`: 最終更新日

## stakeholders.json

- `name`: 関係者名
- `role`: 役割
- `type`: `internal` / `external`
- `importance`: `critical` / `high` / `medium` / `low`
- `status`: 現在の関与状況
- `contact`: 連絡先
- `notes`: 補足

## questions.json

- `id`: 問いID
- `question`: 問い本文
- `owner`: 誰が答えを持つか
- `priority`: `critical` / `high` / `medium` / `low`
- `status`: `open` / `pending` / `in_progress` / `resolved`
- `resolution`: 解決済みの場合の回答
- `notes`: 補足
- `source_log`: 根拠になったログ
- `updated_at`: 更新日

## tasks.json

- `id`: タスクID
- `title`: 行動として書いたタイトル
- `status`: `next` / `in_progress` / `blocked` / `done`
- `depends_on`: 依存する task ID
- `due`: 任意の期限
- `notes`: 補足
- `owner`: 実際に動く人
- `source_log`: 根拠になったログ
- `updated_at`: 更新日

## decisions.json

- `id`: 判断ID
- `date`: 判断日
- `title`: 結論
- `reason`: 理由
- `from_question`: どの問いから出た判断か
- `source_log`: 根拠になったログ
- `updated_at`: 更新日

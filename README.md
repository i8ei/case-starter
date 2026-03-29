# case-starter

現実の案件を、AIエージェントと人間が一緒に扱える形にするための starter テンプレートです。

案件ごとに違うのは具材です。  
進め方の骨格はかなり共通しています。

このリポジトリでは、案件を以下の要素で管理します。

- state（現在状態）
- stakeholders（関係者）
- questions（未確定事項）
- tasks（次アクション）
- decisions（意思決定）
- logs（一次記録）
- dashboard（HTMLでの可視化）

Git を正本にし、AI が読める構造で保持し、人間には HTML で状態を見せます。

## 最小構成

```text
case-starter/
  README.md
  case.json
  stakeholders.json
  questions.json
  tasks.json
  decisions.json
  logs/
  docs/
  public/
  scripts/
```

## 使い方

1. 案件ごとに repo を切る
2. case.json に現在地を書く
3. questions.json に「分からない」を問いとして分解する
4. tasks.json に次アクションを書く
5. logs/ に面談・電話の記録を残す
6. public/index.html で現在地を可視化する

## このプロトタイプについて

このサンプルは **伊福生産森林組合の整理** を題材にした実例です。

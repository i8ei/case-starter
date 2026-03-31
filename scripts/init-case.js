const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

function parseArgs(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    const nextToken = argv[index + 1];

    if (!nextToken || nextToken.startsWith('--')) {
      options[key] = true;
      continue;
    }

    options[key] = nextToken;
    index += 1;
  }

  return options;
}

function slugify(input) {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, relativePath), 'utf8'));
}

function writeJson(relativePath, value) {
  const filePath = path.join(rootDir, relativePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(relativePath, value) {
  const filePath = path.join(rootDir, relativePath);
  fs.writeFileSync(filePath, value, 'utf8');
}

function replaceIfSample(value, nextValue) {
  return typeof value === 'string' && value.includes('サンプル') ? nextValue : value;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const title = typeof args.title === 'string' ? args.title.trim() : '';

  if (!title) {
    console.error('Usage: npm run init -- --title "案件名" [--id case-slug]');
    process.exit(1);
  }

  const caseId = typeof args.id === 'string' && args.id.trim() ? args.id.trim() : slugify(title);

  if (!caseId) {
    console.error('Could not derive a safe case id. Pass --id explicitly.');
    process.exit(1);
  }

  const currentDate = today();
  const caseData = readJson('case.json');
  caseData.id = caseId;
  caseData.title = title;
  caseData.summary = replaceIfSample(
    caseData.summary,
    `${title} の概要をここに書く。何を、誰のために、なぜ動かしているかを一文で。`
  );
  caseData.updated_at = currentDate;
  writeJson('case.json', caseData);

  const stakeholders = readJson('stakeholders.json').map(stakeholder => ({
    ...stakeholder,
    contact: stakeholder.contact || '',
    notes: stakeholder.notes || ''
  }));
  writeJson('stakeholders.json', stakeholders);

  const questions = readJson('questions.json').map(question => ({
    ...question,
    notes: question.notes || '',
    source_log: question.source_log || '',
    updated_at: question.updated_at || currentDate
  }));
  writeJson('questions.json', questions);

  const tasks = readJson('tasks.json').map(task => ({
    ...task,
    owner: task.owner || '',
    source_log: task.source_log || '',
    updated_at: task.updated_at || currentDate
  }));
  writeJson('tasks.json', tasks);

  const decisions = readJson('decisions.json').map(decision => ({
    ...decision,
    source_log: decision.source_log || '',
    updated_at: decision.updated_at || currentDate
  }));
  writeJson('decisions.json', decisions);

  writeText(
    'docs/overview.md',
    `# Overview\n\n${title} の全体像をここに書く。\n\n- 何が問題か\n- 誰が関わっているか\n- 最大のポイントはどこか\n- なぜ今動かす必要があるか\n`
  );

  writeText(
    'docs/critical-path.md',
    '# Critical Path\n\n- 上流論点の確定\n- スキーム確定\n- 関係者合意\n- 実行\n'
  );

  writeText(
    'docs/risks.md',
    '# Risks\n\n- 外部回答待ちで全体が止まるリスク\n- 前提事実の取り違いで後工程がやり直しになるリスク\n- 合意形成が遅れてスケジュールが後ろ倒しになるリスク\n'
  );

  const logPath = path.join(rootDir, 'logs', `${currentDate}-example.md`);
  if (!fs.existsSync(logPath)) {
    writeText(
      path.relative(rootDir, logPath),
      `# ${title} キックオフメモ\n\n- このログは初期サンプルです\n- 初回ヒアリング内容や現状認識を書き換えて使ってください\n`
    );
  }

  console.log(`Initialized case-starter for "${title}" (${caseId}).`);
  console.log('Next step: npm run check');
}

main();

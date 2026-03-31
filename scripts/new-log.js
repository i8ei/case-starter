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

function buildTemplate({ date, type, title, source, participants }) {
  return `---
date: ${date}
type: ${type}
source: ${source || ''}
participants: ${participants || ''}
---

# ${title}

## Summary
- 何が起きたかを1〜3行で書く

## Raw notes
- ここに素材の本文やメモを貼る

## Candidate updates
- New questions:
- Resolved questions:
- New tasks:
- Updated tasks:
- New decisions:
- Case updates:
- No change:
`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const title = typeof args.title === 'string' ? args.title.trim() : '';

  if (!title) {
    console.error('Usage: npm run new-log -- --title "記録タイトル" [--type meeting] [--slug short-name] [--source mail] [--participants "A, B"]');
    process.exit(1);
  }

  const date = typeof args.date === 'string' ? args.date.trim() : today();
  const type = typeof args.type === 'string' ? args.type.trim() : 'note';
  const slug = typeof args.slug === 'string' && args.slug.trim()
    ? args.slug.trim()
    : slugify(title);

  if (!slug) {
    console.error('Could not derive a safe slug. Pass --slug explicitly.');
    process.exit(1);
  }

  const fileName = `${date}-${slug}.md`;
  const filePath = path.join(rootDir, 'logs', fileName);

  if (fs.existsSync(filePath)) {
    console.error(`Log already exists: ${fileName}`);
    process.exit(1);
  }

  const content = buildTemplate({
    date,
    type,
    title,
    source: typeof args.source === 'string' ? args.source.trim() : '',
    participants: typeof args.participants === 'string' ? args.participants.trim() : ''
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Created log template: logs/${fileName}`);
}

main();

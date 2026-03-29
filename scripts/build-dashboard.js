
const fs = require('fs');
const path = require('path');

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', name), 'utf8'));
}

const caseData = readJson('case.json');
const stakeholders = readJson('stakeholders.json');
const questions = readJson('questions.json');
const tasks = readJson('tasks.json');
const decisions = readJson('decisions.json');

function li(items, mapper) {
  return items.map(mapper).join('\n');
}

const html = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <title>${caseData.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 40px; color: #222; line-height: 1.6; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .card { border: 1px solid #ddd; border-radius: 12px; padding: 16px 18px; }
    h1,h2,h3 { margin-top: 0; }
    .pill { display:inline-block; border:1px solid #bbb; border-radius:999px; padding:2px 10px; margin-right:8px; font-size: 14px; }
    .critical { font-weight: 700; }
    code { background:#f6f6f6; padding:2px 5px; border-radius:6px; }
  </style>
</head>
<body>
  <h1>${caseData.title}</h1>
  <p>${caseData.summary}</p>
  <p><span class="pill">status: ${caseData.status}</span><span class="pill">phase: ${caseData.phase}</span><span class="pill">updated_at: ${caseData.updated_at}</span></p>

  <div class="grid">
    <section class="card">
      <h2>現在の blocker</h2>
      <ul>${li(caseData.current_blockers, x => `<li class="critical">${x}</li>`)}</ul>
      <h3>次アクション</h3>
      <ul>${li(caseData.next_actions, x => `<li>${x}</li>`)}</ul>
    </section>

    <section class="card">
      <h2>クリティカルパス</h2>
      <ol>${li(caseData.critical_path, x => `<li>${x}</li>`)}</ol>
    </section>

    <section class="card">
      <h2>関係者</h2>
      <ul>${li(stakeholders, s => `<li><strong>${s.name}</strong> — ${s.role} <code>${s.importance}</code> / ${s.status}</li>`)}</ul>
    </section>

    <section class="card">
      <h2>未解決 questions</h2>
      <ul>${li(questions, q => `<li><strong>${q.id}</strong> ${q.question}<br><small>owner: ${q.owner} / priority: ${q.priority} / status: ${q.status}</small></li>`)}</ul>
    </section>

    <section class="card">
      <h2>tasks</h2>
      <ul>${li(tasks, t => `<li><strong>${t.id}</strong> ${t.title}<br><small>status: ${t.status}${t.due ? ` / due: ${t.due}` : ''}</small></li>`)}</ul>
    </section>

    <section class="card">
      <h2>decisions</h2>
      <ul>${li(decisions, d => `<li><strong>${d.id}</strong> ${d.title}<br><small>${d.date} / ${d.reason}</small></li>`)}</ul>
    </section>
  </div>
</body>
</html>`;
fs.writeFileSync(path.join(__dirname, '..', 'public', 'index.html'), html, 'utf8');
console.log('Dashboard generated: public/index.html');

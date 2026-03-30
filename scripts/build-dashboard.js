const fs = require('fs');
const path = require('path');

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', name), 'utf8'));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function joinHtml(items, mapper) {
  return items.map(mapper).join('\n');
}

function formatDateYmd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysUntil(dateString) {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueDate = new Date(`${dateString}T00:00:00`);
  return Math.ceil((dueDate - startOfToday) / (1000 * 60 * 60 * 24));
}

function firstLine(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content.split(/\r?\n/, 1)[0] || '';
}

const caseData = readJson('case.json');
const stakeholders = readJson('stakeholders.json');
const questions = readJson('questions.json');
const tasks = readJson('tasks.json');
const decisions = readJson('decisions.json');

const statusLabels = {
  waiting_external_response: '⏳ 外部回答待ち',
  in_progress: '🔄 進行中',
  next: '→ 次にやる',
  blocked: '🚫 Block中',
  done: '✅ 完了',
  open: '🔴 未解決',
  pending: '🟡 確認待ち',
  resolved: '✅ 解決済み',
  initial_review: '📋 初期調査中'
};

const importanceLabels = {
  critical: '最重要',
  high: '高',
  medium: '中',
  low: '低'
};

function formatStatus(status) {
  return statusLabels[status] || status;
}

function statusClass(status) {
  if (status === 'blocked' || status === 'open') {
    return 'danger';
  }
  if (status === 'pending') {
    return 'warning';
  }
  if (status === 'done' || status === 'resolved') {
    return 'success';
  }
  if (status === 'next' || status === 'in_progress' || status === 'waiting_external_response' || status === 'initial_review') {
    return 'info';
  }
  return 'neutral';
}

function renderStatusBadge(status) {
  return `<span class="status-badge ${statusClass(status)}">${escapeHtml(formatStatus(status))}</span>`;
}

function renderDueWarning(due) {
  if (!due) {
    return '';
  }

  const today = formatDateYmd(new Date());
  const remainingDays = daysUntil(due);

  if (due < today) {
    return '<span class="due-badge overdue">期限超過</span>';
  }
  if (remainingDays === 0) {
    return '<span class="due-badge soon">今日期限</span>';
  }
  if (remainingDays <= 7) {
    return `<span class="due-badge soon">あと${remainingDays}日</span>`;
  }
  return '';
}

function renderListOrEmpty(items, mapper, emptyText, className = '') {
  if (!items.length) {
    return `<div class="empty-state">${escapeHtml(emptyText)}</div>`;
  }
  const classes = className ? ` class="${className}"` : '';
  return `<ul${classes}>${joinHtml(items, mapper)}</ul>`;
}

const logsDir = path.join(__dirname, '..', 'logs');
const latestLogs = fs.readdirSync(logsDir)
  .filter(f => f.endsWith('.md'))
  .sort()
  .reverse()
  .slice(0, 3)
  .map(file => {
    const title = firstLine(path.join(logsDir, file)).replace(/^#\s*/, '').trim() || file;
    return { file, title };
  });

const blockerCount = caseData.current_blockers.length;
const bannerHtml = blockerCount > 0
  ? `⚠️ ${blockerCount}件のBlockerがあります — 前進できていません`
  : '✅ 順調に進行中';
const bannerClass = blockerCount > 0 ? 'alert' : 'ok';

const criticalQuestions = questions.filter(q => q.priority === 'critical' && (q.status === 'open' || q.status === 'pending'));
const nextTasks = tasks.filter(task => task.status === 'next');

const taskGroupOrder = {
  next: 0,
  in_progress: 1,
  blocked: 2,
  done: 3
};

function sortTasksForDashboard(a, b) {
  const statusDiff = (taskGroupOrder[a.status] ?? 99) - (taskGroupOrder[b.status] ?? 99);
  if (statusDiff !== 0) {
    return statusDiff;
  }

  const dueA = a.due || '9999-12-31';
  const dueB = b.due || '9999-12-31';
  if (dueA !== dueB) {
    return dueA.localeCompare(dueB);
  }

  return a.id.localeCompare(b.id);
}

const taskGroups = [
  {
    label: '着手 / 進行中',
    tasks: tasks
      .filter(task => task.status === 'next' || task.status === 'in_progress')
      .sort(sortTasksForDashboard)
  },
  {
    label: 'Block中',
    tasks: tasks
      .filter(task => task.status === 'blocked')
      .sort(sortTasksForDashboard)
  },
  {
    label: '完了',
    tasks: tasks
      .filter(task => task.status === 'done')
      .sort(sortTasksForDashboard)
  }
];

const otherTasks = tasks
  .filter(task => !(task.status in taskGroupOrder))
  .sort(sortTasksForDashboard);

if (otherTasks.length) {
  taskGroups.push({ label: 'その他', tasks: otherTasks });
}

const importanceOrder = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
};

const sortedStakeholders = [...stakeholders].sort((a, b) => {
  const diff = (importanceOrder[a.importance] ?? 99) - (importanceOrder[b.importance] ?? 99);
  if (diff !== 0) {
    return diff;
  }
  return a.name.localeCompare(b.name, 'ja');
});

const html = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(caseData.title)}</title>
  <style>
    :root {
      --page-bg: #f5f5f5;
      --surface: #ffffff;
      --surface-muted: #f8f9ff;
      --ink: #111827;
      --ink-soft: #4b5563;
      --ink-faint: #9ca3af;
      --header-bg: #1a1a2e;
      --blue: #0070f3;
      --blue-soft: #eff6ff;
      --red: #cc0000;
      --red-deep: #6e1111;
      --red-soft: #fff0f0;
      --green-deep: #14532d;
      --green-soft: #e8f7ed;
      --amber: #f59e0b;
      --amber-soft: #fffbf0;
      --line: #d6d9e3;
      --radius: 18px;
      --shadow: 0 14px 30px rgba(17, 24, 39, 0.08);
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--page-bg);
      color: var(--ink);
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.6;
    }

    a { color: var(--blue); text-decoration: none; }
    a:hover { text-decoration: underline; }

    .page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .stack {
      display: grid;
      gap: 18px;
    }

    .panel {
      background: var(--surface);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      overflow: hidden;
    }

    .header-bar {
      background: var(--header-bg);
      color: #fff;
      padding: 28px 32px;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 20px;
    }

    .header-copy h1 {
      margin: 0;
      font-size: clamp(28px, 4vw, 40px);
      line-height: 1.15;
      letter-spacing: 0.02em;
    }

    .header-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 12px;
    }

    .phase-badge {
      display: inline-flex;
      align-items: center;
      padding: 8px 14px;
      border-radius: 999px;
      background: rgba(0, 112, 243, 0.18);
      color: #dcecff;
      font-weight: 700;
      font-size: 14px;
    }

    .updated-at {
      color: #a6adc8;
      font-size: 13px;
      white-space: nowrap;
    }

    .status-banner {
      padding: 18px 24px;
      border-radius: var(--radius);
      font-size: clamp(20px, 2.2vw, 30px);
      font-weight: 800;
      letter-spacing: 0.01em;
      box-shadow: var(--shadow);
    }

    .status-banner.alert {
      background: var(--red-deep);
      color: #fff;
    }

    .status-banner.ok {
      background: var(--green-deep);
      color: #fff;
    }

    .hero {
      display: grid;
      grid-template-columns: 4fr 3fr 3fr;
      gap: 18px;
      min-height: 40vh;
    }

    .hero-panel {
      background: var(--surface);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 24px;
    }

    .hero-panel h2,
    .section-title {
      margin: 0 0 16px;
      font-size: 22px;
      line-height: 1.2;
    }

    .today-panel {
      background: #f8f9ff;
      border-left: 4px solid var(--blue);
    }

    .today-list,
    .mini-list,
    .stakeholder-list,
    .logs-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .today-list li,
    .mini-list li {
      font-size: 16px;
      line-height: 1.8;
      padding: 10px 0;
      border-bottom: 1px solid rgba(214, 217, 227, 0.9);
    }

    .today-list li:last-child,
    .mini-list li:last-child,
    .stakeholder-list li:last-child,
    .logs-list li:last-child {
      border-bottom: 0;
    }

    .subhead {
      margin: 20px 0 8px;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ink-soft);
    }

    .blocker-card {
      background: var(--red-soft);
      border-left: 4px solid var(--red);
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 12px;
    }

    .blocker-label {
      display: block;
      margin-bottom: 4px;
      color: var(--red);
      font-weight: 800;
    }

    .question-panel {
      background: var(--amber-soft);
      border-left: 4px solid var(--amber);
    }

    .question-card {
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(245, 158, 11, 0.2);
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 12px;
    }

    .question-card:last-child { margin-bottom: 0; }

    .question-owner {
      display: block;
      margin-top: 8px;
      font-size: 13px;
      color: #7c5a10;
      font-weight: 700;
    }

    .timeline {
      padding: 24px;
    }

    .critical-path-wrap {
      overflow-x: auto;
      padding-bottom: 6px;
    }

    .critical-path-track {
      display: flex;
      align-items: stretch;
      gap: 0;
      min-width: max-content;
    }

    .critical-step {
      position: relative;
      padding: 16px 42px 16px 0;
      min-width: 190px;
      color: var(--ink-soft);
      font-size: 13px;
    }

    .critical-step::after {
      content: '';
      position: absolute;
      top: 27px;
      right: 14px;
      width: 18px;
      height: 2px;
      background: var(--line);
    }

    .critical-step:last-child::after { display: none; }

    .step-dot {
      display: inline-block;
      margin-right: 8px;
      font-size: 18px;
      vertical-align: middle;
    }

    .critical-step.done {
      color: var(--ink-faint);
      text-decoration: line-through;
      font-size: 12px;
    }

    .critical-step.current {
      background: var(--blue-soft);
      border-radius: 14px;
      padding: 18px 42px 18px 18px;
      color: var(--ink);
      font-size: 17px;
      font-weight: 800;
    }

    .critical-step.current .step-dot {
      color: var(--blue);
      font-size: 22px;
    }

    .critical-step.future .step-dot,
    .critical-step.done .step-dot {
      color: #9ca3af;
    }

    .lower-grid {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: 18px;
    }

    .section-body {
      padding: 24px;
    }

    .task-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    .task-table th,
    .task-table td {
      padding: 12px 10px;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
    }

    .task-table th {
      color: var(--ink-soft);
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-weight: 800;
    }

    .group-row td {
      padding-top: 20px;
      padding-bottom: 10px;
      border-bottom: 0;
      font-size: 12px;
      color: var(--ink-soft);
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .task-id {
      width: 80px;
      font-weight: 800;
      white-space: nowrap;
    }

    .task-title {
      font-weight: 700;
    }

    .task-meta {
      margin-top: 4px;
      font-size: 12px;
      color: var(--ink-soft);
    }

    .task-row.done {
      opacity: 0.55;
    }

    .task-row.done .task-title {
      text-decoration: line-through;
    }

    .status-badge,
    .due-badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 12px;
      font-weight: 800;
      white-space: nowrap;
    }

    .status-badge.info {
      background: #e8f1ff;
      color: #0f4fbf;
    }

    .status-badge.danger {
      background: var(--red-soft);
      color: var(--red);
    }

    .status-badge.warning {
      background: #fff6df;
      color: #a16207;
    }

    .status-badge.success {
      background: var(--green-soft);
      color: var(--green-deep);
    }

    .status-badge.neutral {
      background: #eceff4;
      color: #4b5563;
    }

    .due-badge {
      margin-left: 8px;
    }

    .due-badge.soon {
      background: #fff6df;
      color: #a16207;
    }

    .due-badge.overdue {
      background: var(--red-soft);
      color: var(--red);
    }

    .side-stack {
      display: grid;
      gap: 18px;
    }

    .stakeholder-list li,
    .logs-list li {
      padding: 12px 0;
      border-bottom: 1px solid var(--line);
    }

    .stakeholder-list strong.critical {
      font-weight: 800;
    }

    .stakeholder-role,
    .stakeholder-status,
    .log-file {
      display: block;
      font-size: 13px;
      color: var(--ink-soft);
    }

    details.panel {
      padding: 0;
    }

    details summary {
      list-style: none;
      cursor: pointer;
      padding: 22px 24px;
      font-size: 18px;
      font-weight: 800;
    }

    details summary::-webkit-details-marker { display: none; }

    .details-body {
      padding: 0 24px 24px;
    }

    .decisions-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    .decisions-table th,
    .decisions-table td {
      text-align: left;
      padding: 12px 10px;
      border-bottom: 1px solid var(--line);
      vertical-align: top;
    }

    .decisions-table th {
      color: var(--ink-soft);
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-weight: 800;
    }

    .empty-state {
      color: var(--ink-soft);
      font-size: 14px;
    }

    @media (max-width: 768px) {
      .page { padding: 14px; }
      .header-bar,
      .hero,
      .lower-grid {
        grid-template-columns: 1fr;
        display: grid;
      }
      .header-bar {
        align-items: flex-start;
        padding: 22px 20px;
      }
      .hero {
        min-height: auto;
      }
      .hero-panel,
      .section-body,
      .timeline,
      details summary,
      .details-body {
        padding-left: 18px;
        padding-right: 18px;
      }
      .critical-path-track {
        display: grid;
        min-width: 0;
      }
      .critical-step {
        min-width: 0;
        padding: 10px 0 10px 0;
      }
      .critical-step.current {
        padding: 14px;
      }
      .critical-step::after {
        display: none;
      }
      .task-table,
      .decisions-table {
        display: block;
        overflow-x: auto;
      }
    }

    @media print {
      body { background: #fff; }
      .page {
        max-width: none;
        padding: 0;
      }
      .panel,
      .hero-panel,
      .status-banner {
        box-shadow: none;
      }
      .hero,
      .lower-grid {
        grid-template-columns: 1fr;
      }
      .critical-path-wrap {
        overflow: visible;
      }
      .critical-path-track {
        display: block;
        min-width: 0;
      }
      .critical-step,
      .critical-step.current {
        display: block;
        min-width: 0;
        padding: 8px 0;
        background: transparent;
      }
      .critical-step::after {
        display: none;
      }
      details {
        display: block;
      }
      details > summary {
        display: none;
      }
      details > .details-body {
        display: block !important;
        padding-top: 0;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="stack">
      <header class="panel header-bar">
        <div class="header-copy">
          <h1>${escapeHtml(caseData.title)}</h1>
          <div class="header-meta">
            <span class="phase-badge">${escapeHtml(caseData.phase)}</span>
            <span class="updated-at">Updated ${escapeHtml(caseData.updated_at)}</span>
          </div>
        </div>
      </header>

      <section class="status-banner ${bannerClass}">${escapeHtml(bannerHtml)}</section>

      <section class="hero">
        <div class="hero-panel today-panel">
          <h2>今日やること</h2>
          ${renderListOrEmpty(
            caseData.next_actions,
            item => `<li>${escapeHtml(item)}</li>`,
            '今日のアクションはまだありません。',
            'today-list'
          )}
          <div class="subhead">next タスク</div>
          ${renderListOrEmpty(
            nextTasks,
            task => `<li><strong>${escapeHtml(task.id)}</strong> ${escapeHtml(task.title)}</li>`,
            'next ステータスのタスクはありません。',
            'mini-list'
          )}
        </div>

        <div class="hero-panel">
          <h2>止まっている理由</h2>
          ${caseData.current_blockers.length
            ? joinHtml(caseData.current_blockers, blocker => `<div class="blocker-card"><span class="blocker-label">🚫 Blocker</span>${escapeHtml(blocker)}</div>`)
            : '<div class="empty-state">現在の blocker はありません。</div>'}
        </div>

        <div class="hero-panel question-panel">
          <h2>次の判断</h2>
          <div class="subhead">❓ 未解決の問い</div>
          ${criticalQuestions.length
            ? joinHtml(criticalQuestions, question => `
              <div class="question-card">
                <div>${escapeHtml(question.question)}</div>
                <span class="question-owner">Owner: ${escapeHtml(question.owner)}</span>
              </div>`)
            : '<div class="empty-state">判断待ちの critical question はありません。</div>'}
        </div>
      </section>

      <section class="panel timeline">
        <h2 class="section-title">道筋</h2>
        <div class="critical-path-wrap">
          <div class="critical-path-track">
            ${joinHtml(caseData.critical_path, (step, index) => {
              const state = index < caseData.critical_path_current_index
                ? 'done'
                : index === caseData.critical_path_current_index
                  ? 'current'
                  : 'future';
              const dot = state === 'current' ? '●' : '○';
              return `<div class="critical-step ${state}"><span class="step-dot">${dot}</span>${escapeHtml(step)}</div>`;
            })}
          </div>
        </div>
      </section>

      <section class="lower-grid">
        <section class="panel">
          <div class="section-body">
            <h2 class="section-title">タスク一覧</h2>
            <table class="task-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>内容</th>
                  <th>状態</th>
                </tr>
              </thead>
              <tbody>
                ${joinHtml(
                  taskGroups.filter(group => group.tasks.length),
                  group => `
                    <tr class="group-row">
                      <td colspan="3">${escapeHtml(group.label)}</td>
                    </tr>
                    ${joinHtml(group.tasks, task => `
                      <tr class="task-row ${escapeHtml(task.status)}">
                        <td class="task-id">${escapeHtml(task.id)}</td>
                        <td>
                          <div class="task-title">${escapeHtml(task.title)}</div>
                          ${task.status === 'blocked' && task.depends_on && task.depends_on.length
                            ? `<div class="task-meta">depends_on: ${escapeHtml(task.depends_on.join(', '))}</div>`
                            : ''}
                          ${task.due
                            ? `<div class="task-meta">due: ${escapeHtml(task.due)} ${renderDueWarning(task.due)}</div>`
                            : ''}
                        </td>
                        <td>${renderStatusBadge(task.status)}</td>
                      </tr>`)}
                  `
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside class="side-stack">
          <section class="panel">
            <div class="section-body">
              <h2 class="section-title">関係者</h2>
              ${renderListOrEmpty(
                sortedStakeholders,
                stakeholder => `
                  <li>
                    <strong class="${stakeholder.importance === 'critical' ? 'critical' : ''}">${escapeHtml(stakeholder.name)}</strong>
                    <span class="stakeholder-role">${escapeHtml(stakeholder.role)}</span>
                    <span class="stakeholder-status">${escapeHtml(importanceLabels[stakeholder.importance] || stakeholder.importance)} / ${escapeHtml(stakeholder.status)}</span>
                  </li>`,
                '関係者はまだ登録されていません。',
                'stakeholder-list'
              )}
            </div>
          </section>

          <section class="panel">
            <div class="section-body">
              <h2 class="section-title">Recent logs</h2>
              ${renderListOrEmpty(
                latestLogs,
                log => `
                  <li>
                    <a href="logs/${encodeURIComponent(log.file)}">${escapeHtml(log.title)}</a>
                    <span class="log-file">${escapeHtml(log.file)}</span>
                  </li>`,
                'ログはまだありません。',
                'logs-list'
              )}
            </div>
          </section>
        </aside>
      </section>

      <details class="panel">
        <summary>意思決定の履歴 (${decisions.length}件)</summary>
        <div class="details-body">
          <table class="decisions-table">
            <thead>
              <tr>
                <th>date</th>
                <th>title</th>
                <th>reason</th>
              </tr>
            </thead>
            <tbody>
              ${joinHtml(decisions, decision => `
                <tr>
                  <td>${escapeHtml(decision.date || '未設定')}</td>
                  <td>${escapeHtml(decision.title)}</td>
                  <td>${escapeHtml(decision.reason)}</td>
                </tr>`)}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, '..', 'public', 'index.html'), html, 'utf8');
console.log('Dashboard generated: public/index.html');

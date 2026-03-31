const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

function readJson(relativePath) {
  const filePath = path.join(rootDir, relativePath);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isOptionalString(value) {
  return value === undefined || typeof value === 'string' || value === null;
}

function isStringArray(value) {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validateSourceLog(prefix, item, report, required = false) {
  if (!isOptionalString(item.source_log)) {
    report.error(`${prefix}.source_log must be a string when present.`);
    return;
  }

  if (!item.source_log) {
    if (required) {
      report.warn(`${prefix}.source_log is empty.`);
    }
    return;
  }

  if (!item.source_log.startsWith('logs/')) {
    report.warn(`${prefix}.source_log should use a logs/ relative path.`);
  }

  if (!fileExists(item.source_log)) {
    report.warn(`${prefix}.source_log "${item.source_log}" does not exist.`);
  }
}

function loadCaseFiles() {
  return {
    caseData: readJson('case.json'),
    stakeholders: readJson('stakeholders.json'),
    questions: readJson('questions.json'),
    tasks: readJson('tasks.json'),
    decisions: readJson('decisions.json'),
    phases: readJson('phases.json')
  };
}

function createReporter() {
  const errors = [];
  const warnings = [];

  return {
    error(message) {
      errors.push(message);
    },
    warn(message) {
      warnings.push(message);
    },
    printAndExit() {
      if (errors.length) {
        console.error('Validation errors:');
        for (const message of errors) {
          console.error(`- ${message}`);
        }
      }

      if (warnings.length) {
        console.warn('Validation warnings:');
        for (const message of warnings) {
          console.warn(`- ${message}`);
        }
      }

      if (errors.length) {
        process.exit(1);
      }

      console.log(`Validation passed with ${warnings.length} warning(s).`);
    }
  };
}

function ensureArrayOfObjects(items, label, report) {
  if (!Array.isArray(items)) {
    report.error(`${label} must be an array.`);
    return false;
  }

  items.forEach((item, index) => {
    if (!isPlainObject(item)) {
      report.error(`${label}[${index}] must be an object.`);
    }
  });

  return true;
}

function validateCase(caseData, phaseIds, report) {
  if (!isPlainObject(caseData)) {
    report.error('case.json must be an object.');
    return;
  }

  const requiredStrings = ['id', 'title', 'status', 'phase', 'summary', 'updated_at'];
  for (const key of requiredStrings) {
    if (!isNonEmptyString(caseData[key])) {
      report.error(`case.json.${key} must be a non-empty string.`);
    }
  }

  if (!isStringArray(caseData.current_blockers)) {
    report.error('case.json.current_blockers must be an array of strings.');
  }

  if (!isStringArray(caseData.next_actions)) {
    report.error('case.json.next_actions must be an array of strings.');
  }

  if (!isStringArray(caseData.critical_path) || caseData.critical_path.length === 0) {
    report.error('case.json.critical_path must be a non-empty array of strings.');
  }

  if (!Number.isInteger(caseData.critical_path_current_index)) {
    report.error('case.json.critical_path_current_index must be an integer.');
  } else if (
    Array.isArray(caseData.critical_path) &&
    (caseData.critical_path_current_index < 0 || caseData.critical_path_current_index >= caseData.critical_path.length)
  ) {
    report.error('case.json.critical_path_current_index must point to a valid critical_path step.');
  }

  if (!isIsoDate(caseData.updated_at)) {
    report.error('case.json.updated_at must use YYYY-MM-DD format.');
  }

  if (caseData.primary_blocker !== undefined && !isOptionalString(caseData.primary_blocker)) {
    report.error('case.json.primary_blocker must be a string when present.');
  }

  if (caseData.post_close_notes !== undefined && !isOptionalString(caseData.post_close_notes)) {
    report.error('case.json.post_close_notes must be a string when present.');
  }

  if (isNonEmptyString(caseData.phase) && !phaseIds.has(caseData.phase)) {
    report.error(`case.json.phase "${caseData.phase}" is not defined in phases.json.`);
  }
}

function validateStakeholders(stakeholders, report) {
  if (!ensureArrayOfObjects(stakeholders, 'stakeholders.json', report)) {
    return;
  }

  const validImportance = new Set(['critical', 'high', 'medium', 'low']);

  stakeholders.forEach((stakeholder, index) => {
    const prefix = `stakeholders.json[${index}]`;

    ['name', 'role', 'type', 'importance', 'status'].forEach(key => {
      if (!isNonEmptyString(stakeholder[key])) {
        report.error(`${prefix}.${key} must be a non-empty string.`);
      }
    });

    if (isNonEmptyString(stakeholder.importance) && !validImportance.has(stakeholder.importance)) {
      report.error(`${prefix}.importance must be one of: critical, high, medium, low.`);
    }

    if (!isOptionalString(stakeholder.contact)) {
      report.error(`${prefix}.contact must be a string when present.`);
    }

    if (!isOptionalString(stakeholder.notes)) {
      report.error(`${prefix}.notes must be a string when present.`);
    }
  });
}

function validateQuestions(questions, report) {
  if (!ensureArrayOfObjects(questions, 'questions.json', report)) {
    return new Set();
  }

  const ids = new Set();
  const validStatus = new Set(['open', 'pending', 'in_progress', 'resolved']);
  const validPriority = new Set(['critical', 'high', 'medium', 'low']);

  questions.forEach((question, index) => {
    const prefix = `questions.json[${index}]`;

    ['id', 'question', 'owner', 'priority', 'status'].forEach(key => {
      if (!isNonEmptyString(question[key])) {
        report.error(`${prefix}.${key} must be a non-empty string.`);
      }
    });

    if (isNonEmptyString(question.id)) {
      if (ids.has(question.id)) {
        report.error(`${prefix}.id "${question.id}" is duplicated.`);
      }
      ids.add(question.id);
    }

    if (isNonEmptyString(question.status) && !validStatus.has(question.status)) {
      report.error(`${prefix}.status must be one of: open, pending, in_progress, resolved.`);
    }

    if (isNonEmptyString(question.priority) && !validPriority.has(question.priority)) {
      report.error(`${prefix}.priority must be one of: critical, high, medium, low.`);
    }

    if (question.status === 'resolved' && !isNonEmptyString(question.resolution)) {
      report.error(`${prefix}.resolution is required when status is resolved.`);
    }

    ['resolution', 'notes', 'updated_at'].forEach(key => {
      if (!isOptionalString(question[key])) {
        report.error(`${prefix}.${key} must be a string when present.`);
      }
    });

    if (typeof question.updated_at === 'string' && !isIsoDate(question.updated_at)) {
      report.error(`${prefix}.updated_at must use YYYY-MM-DD format when present.`);
    }

    validateSourceLog(prefix, question, report, question.status === 'resolved' || question.status === 'in_progress');
  });

  return ids;
}

function validateTasks(tasks, report) {
  if (!ensureArrayOfObjects(tasks, 'tasks.json', report)) {
    return new Set();
  }

  const ids = new Set();
  const validStatus = new Set(['next', 'in_progress', 'blocked', 'done']);

  tasks.forEach((task, index) => {
    const prefix = `tasks.json[${index}]`;

    ['id', 'title', 'status'].forEach(key => {
      if (!isNonEmptyString(task[key])) {
        report.error(`${prefix}.${key} must be a non-empty string.`);
      }
    });

    if (isNonEmptyString(task.id)) {
      if (ids.has(task.id)) {
        report.error(`${prefix}.id "${task.id}" is duplicated.`);
      }
      ids.add(task.id);
    }

    if (isNonEmptyString(task.status) && !validStatus.has(task.status)) {
      report.error(`${prefix}.status must be one of: next, in_progress, blocked, done.`);
    }

    if (!Array.isArray(task.depends_on) || !task.depends_on.every(item => typeof item === 'string')) {
      report.error(`${prefix}.depends_on must be an array of strings.`);
    }

    ['due', 'notes', 'owner', 'updated_at'].forEach(key => {
      if (!isOptionalString(task[key])) {
        report.error(`${prefix}.${key} must be a string when present.`);
      }
    });

    if (typeof task.due === 'string' && !isIsoDate(task.due)) {
      report.error(`${prefix}.due must use YYYY-MM-DD format when present.`);
    }

    if (typeof task.updated_at === 'string' && !isIsoDate(task.updated_at)) {
      report.error(`${prefix}.updated_at must use YYYY-MM-DD format when present.`);
    }

    validateSourceLog(prefix, task, report, task.status !== 'next');
  });

  return ids;
}

function validateDecisions(decisions, questionIds, report) {
  if (!ensureArrayOfObjects(decisions, 'decisions.json', report)) {
    return;
  }

  const ids = new Set();

  decisions.forEach((decision, index) => {
    const prefix = `decisions.json[${index}]`;

    ['id', 'title', 'reason'].forEach(key => {
      if (!isNonEmptyString(decision[key])) {
        report.error(`${prefix}.${key} must be a non-empty string.`);
      }
    });

    if (isNonEmptyString(decision.id)) {
      if (ids.has(decision.id)) {
        report.error(`${prefix}.id "${decision.id}" is duplicated.`);
      }
      ids.add(decision.id);
    }

    ['date', 'from_question', 'updated_at'].forEach(key => {
      if (!isOptionalString(decision[key])) {
        report.error(`${prefix}.${key} must be a string or null when present.`);
      }
    });

    if (typeof decision.date === 'string' && !isIsoDate(decision.date)) {
      report.error(`${prefix}.date must use YYYY-MM-DD format when present.`);
    }

    if (typeof decision.updated_at === 'string' && !isIsoDate(decision.updated_at)) {
      report.error(`${prefix}.updated_at must use YYYY-MM-DD format when present.`);
    }

    if (isNonEmptyString(decision.from_question) && !questionIds.has(decision.from_question)) {
      report.error(`${prefix}.from_question "${decision.from_question}" is not defined in questions.json.`);
    }

    validateSourceLog(prefix, decision, report, true);
  });
}

function validatePhases(phases, report) {
  if (!ensureArrayOfObjects(phases, 'phases.json', report)) {
    return new Set();
  }

  const phaseIds = new Set();

  phases.forEach((phase, index) => {
    const prefix = `phases.json[${index}]`;

    ['id', 'label', 'description'].forEach(key => {
      if (!isNonEmptyString(phase[key])) {
        report.error(`${prefix}.${key} must be a non-empty string.`);
      }
    });

    if (isNonEmptyString(phase.id)) {
      if (phaseIds.has(phase.id)) {
        report.error(`${prefix}.id "${phase.id}" is duplicated.`);
      }
      phaseIds.add(phase.id);
    }

    if (!Array.isArray(phase.next) || !phase.next.every(item => typeof item === 'string')) {
      report.error(`${prefix}.next must be an array of strings.`);
    }
  });

  phases.forEach((phase, index) => {
    const prefix = `phases.json[${index}]`;
    if (!Array.isArray(phase.next)) {
      return;
    }

    phase.next.forEach(nextId => {
      if (!phaseIds.has(nextId)) {
        report.error(`${prefix}.next contains undefined phase "${nextId}".`);
      }
    });
  });

  return phaseIds;
}

function validateCrossReferences(tasks, taskIds, report) {
  tasks.forEach((task, index) => {
    if (!Array.isArray(task.depends_on)) {
      return;
    }

    task.depends_on.forEach(dependsOnId => {
      if (!taskIds.has(dependsOnId)) {
        report.error(`tasks.json[${index}].depends_on references undefined task "${dependsOnId}".`);
      }
    });

    if (task.status === 'blocked' && task.depends_on.length === 0) {
      report.warn(`tasks.json[${index}] is blocked but has no depends_on reference.`);
    }
  });
}

function main() {
  const report = createReporter();
  const { caseData, stakeholders, questions, tasks, decisions, phases } = loadCaseFiles();

  const phaseIds = validatePhases(phases, report);
  validateCase(caseData, phaseIds, report);
  validateStakeholders(stakeholders, report);
  const questionIds = validateQuestions(questions, report);
  const taskIds = validateTasks(tasks, report);
  validateCrossReferences(tasks, taskIds, report);
  validateDecisions(decisions, questionIds, report);

  report.printAndExit();
}

main();
